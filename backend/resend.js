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

// Simple pricing structure - just the totals we want
export const pricingTiers = {
    1: { totalGross: 28.00, productGross: 24.00, shippingGross: 4.00 },
    2: { totalGross: 50.00, productGross: 46.00, shippingGross: 4.00 },
    3: { totalGross: 70.00, productGross: 66.00, shippingGross: 4.00 },
    4: { totalGross: 88.00, productGross: 88.00, shippingGross: 0.00 },
    5: { totalGross: 110.00, productGross: 110.00, shippingGross: 0.00 },
};

// Convert gross to net (for display purposes only)
const grossToNet = (gross) => round2(gross / (1 + TAX_RATE));

export async function sendCreapureInvoice(to, invoiceData) {
    const invoiceNumber = random6DigitCode();
    const amount = Math.min(5, Math.max(1, Number(invoiceData.amount)));
    const pricing = pricingTiers[amount];
    const quantity = parseQty(invoiceData.amount);
    
    // Calculate net prices for display (the PDF library will add tax back)
    const productNetTotal = grossToNet(pricing.productGross);
    const productUnitNet = round2(productNetTotal / quantity);
    const shippingUnitNet = grossToNet(pricing.shippingGross);

    console.log('Pricing calculation:');
    console.log('Amount tier:', amount);
    console.log('Expected total gross:', pricing.totalGross);
    console.log('Product gross:', pricing.productGross);
    console.log('Shipping gross:', pricing.shippingGross);
    console.log('Product unit net:', productUnitNet);
    console.log('Shipping unit net:', shippingUnitNet);

    const pdfPath = `./invoice-${invoiceNumber}.pdf`;
    
    // Build items array
    const items = [
        {
            name: 'Creapure',
            quantity,
            price: productUnitNet,
            tax: TAX_RATE_PERCENT,
        }
    ];

    // Only add shipping if there's a cost
    if (pricing.shippingGross > 0) {
        items.push({
            name: 'Verzendkosten',
            quantity: 1,
            price: shippingUnitNet,
            tax: TAX_RATE_PERCENT,
        });
    }

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
        items: items,
        qr: {
            data: 'https://www.gieriggroeien.nl',
            width: 50,
        },
        note: {
            text: 'Bedankt voor je deelname.',
            italic: false,
        },
    };

    console.log('Generating invoice PDF with payload:', JSON.stringify(payload, null, 2));
    
    // Verify the calculation will work
    const calculatedProductGross = round2(productUnitNet * (1 + TAX_RATE) * quantity);
    const calculatedShippingGross = pricing.shippingGross > 0 ? round2(shippingUnitNet * (1 + TAX_RATE)) : 0;
    const calculatedTotal = round2(calculatedProductGross + calculatedShippingGross);
    
    console.log('Verification:');
    console.log('Expected total:', pricing.totalGross);
    console.log('Calculated total:', calculatedTotal);
    console.log('Difference:', round2(pricing.totalGross - calculatedTotal));
    console.log('Match:', Math.abs(pricing.totalGross - calculatedTotal) < 0.01 ? '✅' : '❌');


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
        <p><strong>Bedrag:</strong> €${pricing.totalGross.toFixed(2)}</p>
        <p>Factuur is toegevoegd als bijlage.</p>
      </div>
    `;

        await sendEmail(
            'huntymonster@gmail.com',
            `Nieuwe aankoop: ${invoiceData.customerName} (€${pricing.totalGross.toFixed(2)})`,
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