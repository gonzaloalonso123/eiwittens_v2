import 'dotenv/config'
import { Resend } from "resend"
import { CustomInvoiceGenerator } from "./custom-invoice-generator.js"
import { generateInvoiceNumber } from "./utils.js"

const resend = new Resend(process.env.RESEND_API_KEY)

const PRICING_TIERS = {
  1: { gross: 28.0, net: 25.69, vat: 2.31 },
  2: { gross: 50.0, net: 45.87, vat: 4.13 },
  3: { gross: 70.0, net: 64.22, vat: 5.78 },
  4: { gross: 88.0, net: 80.73, vat: 7.27 },
  5: { gross: 110.0, net: 100.92, vat: 9.08 },
}

export async function sendCreapureInvoice(customerData) {
  const { name, email, address, amount } = customerData

  // Get pricing for the quantity
  const pricing = PRICING_TIERS[amount]
  if (!pricing) {
    throw new Error(`Invalid quantity: ${amount}`)
  }

  // Create invoice data
  const invoiceData = {
    invoiceNumber: generateInvoiceNumber(),
    date: new Date().toLocaleDateString("nl-NL"),
    company: {
      name: "GierigGroeien.nl",
      email: "info@gieriggroeien.nl",
      website: "https://www.gieriggroeien.nl",
      taxId: "NL867169576B01",
      kvk: "95532595",
    },
    customer: {
      name,
      address,
      email,
    },
    items: [
      {
        name: "Creapure",
        amount,
        priceExVat: pricing.net / amount,
        vatRate: 9,
        totalExVat: pricing.net,
        vatAmount: pricing.vat,
        totalIncVat: pricing.gross,
      },
    ],
    subtotalExVat: pricing.net,
    totalVat: pricing.vat,
    totalIncVat: pricing.gross,
    note: "Bedankt voor je deelname.",
  }

  const generator = new CustomInvoiceGenerator()
  const pdfBuffer = generator.generateInvoice(invoiceData)


  console.log("Generated PDF Buffer:", pdfBuffer, email, name, amount)
  const result = await resend.emails.send({
    from: "GierigGroeien <info@gieriggroeien.nl>",
    to: email,
    subject: `Factuur ${invoiceData.invoiceNumber} - Creapure Bestelling`,
    html: `
      <h2>Bedankt voor je bestelling!</h2>
      <p>Beste ${name},</p>
      <p>Hierbij ontvang je de factuur voor je Creapure bestelling van ${amount}kg.</p>
      <p>Je bestelling wordt binnenkort verzonden.</p>
      <p>Met vriendelijke groet,<br>Team GierigGroeien</p>
    `,
    attachments: [
      {
        filename: `factuur-${invoiceData.invoiceNumber}.pdf`,
        content: pdfBuffer,
      },
    ],
  }).catch((error) => {
    console.error("Error sending invoice email:", error)
  })

  return result
}
