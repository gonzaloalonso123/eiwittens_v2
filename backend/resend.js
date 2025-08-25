import { Resend } from 'resend';
import fs from 'fs/promises';
import { PDFInvoice } from '@h1dd3nsn1p3r/pdf-invoice';
import dotenv from 'dotenv';
import { title } from 'process';
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

// ===== Helpers =====
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

const random6DigitCode = () =>
    Math.floor(100000 + Math.random() * 900000).toString();

const TAX_RATE_PERCENT = 9;           // shown on invoice
const TAX_RATE = TAX_RATE_PERCENT / 100; // for math

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const parseQty = (val) => {
    if (val === null || val === undefined) return 1;
    const str = String(val).trim().replace(',', '.');
    const num = Number(str);
    return Number.isFinite(num) && num > 0 ? num : 1;
};

const netFromGross = (gross) => round2(Number(gross) / (1 + TAX_RATE));

// ===== Main =====
export async function sendCreapureInvoice(to, invoiceData) {
    const invoiceNumber = random6DigitCode();

    // ---- Inputs ----
    const grossTotal = round2(Number(invoiceData.amount)); // e.g. 28
    const shippingGrossInput =
        typeof invoiceData.shipping === 'number' && invoiceData.shipping >= 0
            ? round2(invoiceData.shipping)
            : 4; // default shipping gross
    let productGross = round2(grossTotal - shippingGrossInput);
    if (productGross < 0) productGross = 0;
    const shippingGross = shippingGrossInput;

    const quantity = parseQty(invoiceData.kilograms); // supports "0,5", defaults to 1

    // ---- Convert gross → net (per unit) so the lib can add 9% VAT from percent ----
    // product: divide total product gross by (1+VAT) to get net total, then per-unit
    const productNetTotal = netFromGross(productGross);
    let productUnitNet = round2(productNetTotal / quantity);

    // shipping: quantity is 1
    let shippingUnitNet = netFromGross(shippingGross);

    // ---- Re-check totals & apply tiny rounding correction if ever needed ----
    const recalcProductGross = round2(productUnitNet * (1 + TAX_RATE) * quantity);
    const recalcShippingGross = round2(shippingUnitNet * (1 + TAX_RATE) * 1);
    let diff = round2(grossTotal - (recalcProductGross + recalcShippingGross));

    if (diff !== 0) {
        // Distribute the rounding diff into the product unit net
        const perUnitGrossAdj = round2(diff / quantity);
        const perUnitNetAdj = round2(perUnitGrossAdj / (1 + TAX_RATE));
        productUnitNet = round2(productUnitNet + perUnitNetAdj);

        // Recompute; if there is still a 1-cent remainder, push it into shipping
        const afterProductGross = round2(productUnitNet * (1 + TAX_RATE) * quantity);
        const remain = round2(grossTotal - (afterProductGross + recalcShippingGross));
        if (remain !== 0) {
            const shipNetAdj = round2(remain / (1 + TAX_RATE));
            shippingUnitNet = round2(shippingUnitNet + shipNetAdj);
        }
    }

    const pdfPath = `./invoice-${invoiceNumber}.pdf`;

    const payload = {
        company: {
            logo: await fs.readFile('./images/logo.svg', 'utf8'),
            name: 'GierigGroeien.nl',
            email: 'Mail: info@creapure.gieriggroeien.nl',
            website: 'Web: https://www.gieriggroeien.nl',
            taxId: 'NL867169576B01',
            // bank: 'NL18BUNQ2142472885',
        },
        customer: {
            name: invoiceData.customerName,
            address: invoiceData.customerAddress,
            email: invoiceData.customerEmail,
        },
        invoice: {
            number: invoiceNumber,
            date: new Date().toLocaleDateString('nl-NL'),
            dueDate: new Date().toLocaleDateString('nl-NL'),
            status: 'Paid!',
            locale: 'nl-NL',
            currency: 'EUR',
            path: pdfPath,
        },
        items: [
            {
                name: 'Creapure',
                quantity,                 // ✅ never 0 due to parseQty fallback
                price: productUnitNet,    // ✅ net price per unit
                tax: TAX_RATE_PERCENT,    // ✅ percent, not absolute euros
            },
            {
                name: 'Verzendkosten',
                quantity: 1,
                price: shippingUnitNet,   // ✅ net price
                tax: TAX_RATE_PERCENT,    // ✅ percent
            },
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
            tax: "Belasting",
            total: "Totaal",
            subTotal: "Subtotaal",
            totalTax: "Totaal Belasting",
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

        // Customer email
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

        // Admin notification
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
        console.error('Error sending email with attachment:', error);
        throw error;
    } finally {
        try {
            await fs.unlink(pdfFilePath); // ✅ remove the actual created file
        } catch {
            /* ignore */
        }
    }
}
