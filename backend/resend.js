import { Resend } from "resend"
import { CustomInvoiceGenerator } from "./custom-invoice-generator"

const resend = new Resend(process.env.RESEND_API_KEY)

async function sendEmail(to, subject, html, attachments = []) {
    const { data, error } = await resend.emails.send({
        from: "Gierig Groeien <info@creapure.gieriggroeien.nl>",
        to: [to],
        subject,
        html,
        attachments,
    })
    if (error) {
        console.error({ error })
        throw error
    }
    console.log({ data })
}

const random6DigitCode = () => Math.floor(100000 + Math.random() * 900000).toString()

export const pricingTiers = {
    1: { totalGross: 28.0, productGross: 24.0, shippingGross: 4.0 },
    2: { totalGross: 50.0, productGross: 46.0, shippingGross: 4.0 },
    3: { totalGross: 70.0, productGross: 66.0, shippingGross: 4.0 },
    4: { totalGross: 88.0, productGross: 88.0, shippingGross: 0.0 },
    5: { totalGross: 110.0, productGross: 110.0, shippingGross: 0.0 },
}

const parseQty = (val) => {
    if (val === null || val === undefined) return 1
    const str = String(val).trim().replace(",", ".")
    const num = Number(str)
    return Number.isFinite(num) && num > 0 ? num : 1
}



export async function sendCreapureInvoice(to, invoiceData) {
    const invoiceNumber = random6DigitCode()
    const amount = Math.min(5, Math.max(1, Number(invoiceData.amount)))
    const pricing = pricingTiers[amount]
    const quantity = parseQty(invoiceData.amount)
    const vatRate = 9 // 9% VAT
    const vatMultiplier = 1 + vatRate / 100 // 1.09
    const productNetTotal = pricing.productGross / vatMultiplier
    const shippingNetTotal = pricing.shippingGross / vatMultiplier
    const totalNet = productNetTotal + shippingNetTotal
    const totalVat = pricing.totalGross - totalNet

    const items = [
        {
            name: "Creapure",
            quantity,
            priceExVat: productNetTotal / quantity,
            vatRate,
            totalExVat: productNetTotal,
            vatAmount: pricing.productGross - productNetTotal,
            totalIncVat: pricing.productGross,
        },
    ]

    if (pricing.shippingGross > 0) {
        items.push({
            name: "Verzendkosten",
            quantity: 1,
            priceExVat: shippingNetTotal,
            vatRate,
            totalExVat: shippingNetTotal,
            vatAmount: pricing.shippingGross - shippingNetTotal,
            totalIncVat: pricing.shippingGross,
        })
    }

    const invoicePayload = {
        invoiceNumber,
        date: new Date().toLocaleDateString("nl-NL"),
        company: {
            name: "GierigGroeien.nl",
            email: "Mail: info@gieriggroeien.nl",
            website: "Web: https://www.gieriggroeien.nl",
            taxId: "BTW: NL867169576B01",
            kvk: "KVK: 95532595",
        },
        customer: {
            name: invoiceData.customerName,
            address: invoiceData.customerAddress,
            email: invoiceData.customerEmail,
        },
        items,
        subtotalExVat: totalNet,
        totalVat,
        totalIncVat: pricing.totalGross,
        note: "Bedankt voor je deelname.",
    }

    console.log("Generating custom invoice with exact totals:", {
        productGross: pricing.productGross,
        shippingGross: pricing.shippingGross,
        totalGross: pricing.totalGross,
        calculatedTotal: invoicePayload.totalIncVat,
    })

    const generator = new CustomInvoiceGenerator()
    const pdfBuffer = generator.generateInvoice(invoicePayload)

    try {
        const attachments = [
            {
                filename: `factuur-${invoiceNumber}.pdf`,
                content: pdfBuffer.toString("base64"),
                type: "application/pdf",
            },
        ]

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
        `

        await sendEmail(to, "Factuur – Creapure Crowdfundactie", customerHtml, attachments)

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
        `

        await sendEmail(
            "huntymonster@gmail.com",
            `Nieuwe aankoop: ${invoiceData.customerName} (€${pricing.totalGross.toFixed(2)})`,
            adminHtml,
            attachments,
        )
    } catch (error) {
        console.error("Error sending invoice email:", error)
        throw error
    }
}
