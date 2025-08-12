import { Resend } from 'resend';
import fs from 'fs';
const resend = new Resend({ apiKey: process.env.RESEND_API_KEY });
const { PDFInvoice } = require('@h1dd3nsn1p3r/pdf-invoice');
import logo from '/images/logo.png';

async function sendEmail(to, subject, html, attachments = []) {
    const { data, error } = await resend.emails.send({
        from: 'Acme <info@gieriggroeien.nl>',
        to: [to],
        subject: subject,
        html: html,
        attachments: attachments,
    });

    if (error) {
        return console.error({ error });
    }

    console.log({ data });
}

const random6DigitCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const dividePriceAndTax = (price) => {
    const taxRate = 0.21;
    const tax = price * taxRate / (1 + taxRate);
    const netPrice = price - tax;
    return {
        netPrice: netPrice.toFixed(2),
        tax: tax.toFixed(2)
    };
};

export async function sendCreapureInvoice(to, invoiceData) {
    const { netPrice, tax } = dividePriceAndTax(invoiceData.amount);
    const invoiceNumber = random6DigitCode();
    const pdfPath = `./invoice-${invoiceNumber}.pdf`;

    const payload = {
        company: {
            logo: logo,
            name: "Trivita Compare Solutions",
            address: "Laakkade 444 2521XZ ‘s-Gravenhage",
            phone: "Tel: 06 ",
            email: "Mail: info@gieriggroeien.nl",
            website: "Web: https://www.gierigroeien.nl",
            taxId: "NL867169576B01",
            bank: "NL18BUNQ2142472885",
        },
        customer: {
            name: invoiceData.customerName,
            address: invoiceData.customerAddress,
            email: invoiceData.customerEmail,
        },
        invoice: {
            number: invoiceNumber,
            date: "25/12/2023",
            dueDate: "25/12/2023",
            status: "Paid!",
            locale: "nl-NL",
            currency: "EUR",
            path: pdfPath,
        },
        items: [
            {
                name: "Creapure",
                quantity: invoiceData.kilograms,
                price: netPrice,
                tax: tax,
            },
            {
                name: "Verzendkosten",
                quantity: 1,
                price: 4,
                tax: 0,
            },
        ],
        qr: {
            data: "https://www.gierigroeien.nl",
            width: 50,
        },
        note: {
            text: "Thank you for your business.",
            italic: false,
        }
    };


    const pdfInvoice = new PDFInvoice(payload);
    await pdfInvoice.generate();
    const pdfBuffer = fs.readFileSync(pdfPath);
    const attachments = [
        {
            filename: `factuur-${invoiceNumber}.pdf`,
            content: pdfBuffer,
            type: 'application/pdf',
        }
    ];

    const html = `
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

    try {
        await sendEmail(to, 'Factuur – Creapure Crowdfundactie', html, attachments);
        fs.unlinkSync(pdfPath);
    } catch (error) {
        console.error('Error sending email with attachment:', error);
        if (fs.existsSync(pdfPath)) {
            fs.unlinkSync(pdfPath);
        }
        throw error;
    }
}