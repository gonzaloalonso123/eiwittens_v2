import { Resend } from 'resend';
import fs from 'fs/promises';
import { PDFInvoice } from '@h1dd3nsn1p3r/pdf-invoice';
import dotenv from 'dotenv';
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail(to, subject, html, attachments = []) {
    const { data, error } = await resend.emails.send({
        from: 'Acme <info@creapure.gieriggroeien.nl>',
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

const dividePriceAndTax = (price) => {
    const taxRate = 0.21;
    const tax = (price * taxRate) / (1 + taxRate);
    const netPrice = price - tax;
    return {
        netPrice: netPrice.toFixed(2),
        tax: tax.toFixed(2),
    };
};

export async function sendCreapureInvoice(to, invoiceData) {
    const { net, tax, taxRate } = dividePriceAndTax(invoiceData.amount);
    const invoiceNumber = random6DigitCode();
    const pdfPath = `./invoice-${invoiceNumber}.pdf`;

    const payload = {
        company: {
            logo: await fs.readFile('./images/logo.svg', 'utf8'),
            name: 'Trivita Compare Solutions',
            address: "Laakkade 444 2521XZ ‘s-Gravenhage",
            phone: 'Tel: 06 ',
            email: 'Mail: info@creapure.gieriggroeien.nl',
            website: 'Web: https://www.gieriggroeien.nl',
            taxId: 'NL867169576B01',
            bank: 'NL18BUNQ2142472885',
        },
        customer: {
            name: invoiceData.customerName,
            address: invoiceData.customerAddress,
            email: invoiceData.customerEmail,
        },
        invoice: {
            number: invoiceNumber,
            date: '25/12/2023',
            dueDate: '25/12/2023',
            status: 'Paid!',
            locale: 'nl-NL',
            currency: 'EUR',
            path: pdfPath,
        },
        items: [
            {
                name: "Creapure",
                quantity: 1,                      // total purchase
                price: net,                       // net unit price
                tax: taxRate                      // library expects percent, not absolute
            },
            {
                name: "Verzendkosten",
                quantity: 1,
                price: 4 / 1.09,                  // net of shipping (if shipping also has 9%)
                tax: 9
            },
        ],
        qr: {
            data: 'https://www.gieriggroeien.nl',
            width: 50,
        },
        note: {
            text: 'Thank you for your business.',
            italic: false,
        },
    };

    const invoice = new PDFInvoice(payload);
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
        <p><strong>Bestelling:</strong> ${invoiceData.kilograms} kg Creapure</p>
        <p><strong>Bedrag:</strong> €${invoiceData.amount.toFixed(2)}</p>
        <p>Factuur is toegevoegd als bijlage.</p>
      </div>
    `;

        await sendEmail(
            'info@gieriggroeien.nl',
            `Nieuwe aankoop: ${invoiceData.customerName} (€${invoiceData.amount.toFixed(2)})`,
            adminHtml,
            attachments
        );
    } catch (error) {
        console.error('Error sending email with attachment:', error);
        throw error;
    } finally {
        try {
            await fs.unlink(pdfPath);
        } catch { }
    }
}
