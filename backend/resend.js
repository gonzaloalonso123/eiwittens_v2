import { Resend } from 'resend';
import fs from 'fs/promises';
import { PDFInvoice } from '@h1dd3nsn1p3r/pdf-invoice';
import dotenv from 'dotenv';
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);
async function sendEmail(to, subject, html, attachments = []) {
    const { data, error } = await resend.emails.send({
        from: 'Gierig Groeien <info@creapure.gieriggroeien.nl>',
        to: [to],
        subject,
        html,
        attachments,
    });
    if (error) {
        console.error({ error });
        throw error;
    }
    console.log({ data });
}

const random6DigitCode = () => Math.floor(100000 + Math.random() * 900000).toString();
const TAX_RATE_PERCENT = 9;
const TAX_RATE = TAX_RATE_PERCENT / 100;
const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const parseQty = (val) => {
    if (val === null || val === undefined) return 1;
    const str = String(val).trim().replace(',', '.');
    const num = Number(str);
    return Number.isFinite(num) && num > 0 ? num : 1;
};

const netFromGross = (gross) => round2(Number(gross) / (1 + TAX_RATE));

export const amounts = {
    1: { base: 24.00, delivery: 4.00 },
    2: { base: 46.00, delivery: 4.00 },
    3: { base: 66.00, delivery: 4.00 },
    4: { base: 88.00, delivery: 0.00 },
    5: { base: 110.00, delivery: 0.00 },
};

export async function sendCreapureInvoice(to, invoiceData) {
    const invoiceNumber = random6DigitCode();
    const amount = Math.min(5, Math.max(1, Number(invoiceData.amount)));
    const { base, delivery } = amounts[amount];

    const grossTotal = base + delivery;
    const shippingGross = delivery;

    let productGross = base;
    const quantity = parseQty(invoiceData.amount);
    const productNetTotal = netFromGross(productGross);
    let productUnitNet = round2(productNetTotal / quantity);
    let shippingUnitNet = netFromGross(shippingGross);
    const recalcProductGross = round2(productUnitNet * (1 + TAX_RATE) * quantity);
    const recalcShippingGross = round2(shippingUnitNet * (1 + TAX_RATE) * 1);
    let diff = round2(grossTotal - (recalcProductGross + recalcShippingGross));

    if (diff !== 0) {
        const perUnitGrossAdj = round2(diff / quantity);
        const perUnitNetAdj = round2(perUnitGrossAdj / (1 + TAX_RATE));
        productUnitNet = round2(productUnitNet + perUnitNetAdj);
        const afterProductGross = round2(productUnitNet * (1 + TAX_RATE) * quantity);
        const remain = round2(grossTotal - (afterProductGross + recalcShippingGross));
        if (remain !== 0 && shippingGross > 0) {
            const shipNetAdj = round2(remain / (1 + TAX_RATE));
            shippingUnitNet = round2(shippingUnitNet + shipNetAdj);
        } else if (remain !== 0) {
            const remainNetPerUnit = round2(remain / (1 + TAX_RATE) / quantity);
            productUnitNet = round2(productUnitNet + remainNetPerUnit);
        }
    }


    const pdfPath = `./invoice-${invoiceNumber}.pdf`;

    const payload = {
        company: {
            logo: await fs.readFile('./images/logo.svg', 'utf8'),
            name: 'GierigGroeien.nl',
            email: 'Mail: info@gieriggroeien.nl',
            website: 'Web: https://www.gieriggroeien.nl',
            taxId: 'BTW: NL867169576B01',
            bank: 'KVK: 95532595',
        },
        customer: {
            name: invoiceData.customerName,
            address: invoiceData.customerAddress,
            email: invoiceData.customerEmail,
        },
        invoice: {
            number: invoiceNumber,
            date: new Date().toLocaleDateString('nl-NL'),
            dueDate: '',
            status: 'Betaald!',
            locale: 'nl-NL',
            currency: 'EUR',
            path: pdfPath,
        },
        items: [
            {
                name: 'Creapure',
                quantity,
                price: productUnitNet,
                tax: TAX_RATE_PERCENT,
            },
            // Only add shipping item if there's actually a shipping cost
            ...(shippingGross > 0 ? [{
                name: 'Verzendkosten',
                quantity: 1,
                price: shippingUnitNet,
                tax: TAX_RATE_PERCENT,
            }] : []),
        ],
        qr: {
            data: 'https://www.gieriggroeien.nl',
            width: 50,
        },
        note: {
            text: 'Bedankt voor je deelname.',
            italic: false,
        },
    };

    console.log('Generating invoice PDF with payload:', payload);


    const config = {
        string: {
            invoice: "F A C T U U R",
            refNumber: "Referentienummer",
            date: "Datum",
            dueDate: "Verzenddatum",
            status: "Status",
            billTo: "Factureren aan",
            item: "Artikel",
            quantity: "Aantal",
            price: "Prijs",
            tax: "BTW",
            total: "Totaal",
            subTotal: "Subtotaal",
            totalTax: "Totaal BTW",
        },
    };
    const invoice = new PDFInvoice(payload, config);
    const pdfFilePath = await invoice.create();

    try {
        const pdfBuffer = await fs.readFile(pdfFilePath);
        const attachments = [
            {
                filename: `factuur-${invoiceNumber}.pdf`,
                content: pdfBuffer.toString('base64'),
                type: 'application/pdf',
            },
        ];
        const customerHtml = `
      <div style="font-family: Arial, sans-serif; color: #222;">
        <p>Hi ${invoiceData.customerName},</p>
        <p>
          Bedankt voor je deelname aan de <strong>Creapure Crowdfundactie</strong>—samen kunnen we écht gierig groeien! 💪<br>
          In de bijlage vind je je factuur (betaalbewijs).
        </p>
        <h3>Wat gebeurt er nu?</h3>
        <ul>
          <li>We mailen je bij de mijlpalen: doel behaald → bestelling geplaatst → verzending gestart.</li>
          <li>Wordt het doel niet gehaald? Dan storten we het volledige bedrag automatisch terug.</li>
        </ul>
        <p>
          Vragen? Stuur een berichtje naar <a href="mailto:info@gieriggroeien.nl">info@gieriggroeien.nl</a>.
        </p>
        <p>Groet,<br>Team GierigGroeien.nl</p>
      </div>
    `;

        await sendEmail(
            to,
            'Factuur – Creapure Crowdfundactie',
            customerHtml,
            attachments
        );
        const adminHtml = `
      <div style="font-family: Arial, sans-serif; color: #222;">
        <h2>Nieuwe aankoop ontvangen 🎉</h2>
        <p><strong>Klant:</strong> ${invoiceData.customerName}</p>
        <p><strong>Email:</strong> ${invoiceData.customerEmail}</p>
        <p><strong>Adres:</strong> ${invoiceData.customerAddress}</p>
        <p><strong>Bestelling:</strong> ${quantity} kg Creapure</p>
        <p><strong>Bedrag:</strong> €${grossTotal.toFixed(2)}</p>
        <p>Factuur is toegevoegd als bijlage.</p>
      </div>
    `;

        await sendEmail(
            'huntymonster@gmail.com',
            `Nieuwe aankoop: ${invoiceData.customerName} (€${grossTotal.toFixed(2)})`,
            adminHtml,
            attachments
        );
    } catch (error) {
        console.error('Error sending invoice email:', error);
        throw error;
    }
    finally {
        try {
            await fs.unlink(pdfFilePath);
        } catch (err) {
            console.error('Error deleting PDF file:', err);
        }
    }
}