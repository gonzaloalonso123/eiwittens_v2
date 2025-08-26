
import { Resend } from "resend"
import { CustomInvoiceGenerator } from "./custom-invoice-generator.js"
import { generateInvoiceNumber } from "./utils.js"
import 'dotenv/config';

const resend = new Resend(process.env.RESEND_API_KEY)
console.log("Resend API Key:", process.env.RESEND_API_KEY)

const PRICING_TIERS = {
  1: { 
    productGross: 24.0, 
    deliveryGross: 4.0,
    productNet: 22.02, 
    deliveryNet: 3.67,
    productVat: 1.98,
    deliveryVat: 0.33,
    totalGross: 28.0 
  },
  2: { 
    productGross: 46.0, 
    deliveryGross: 3.0,
    productNet: 42.20, 
    deliveryNet: 2.75,
    productVat: 3.80,
    deliveryVat: 0.25,
    totalGross: 49.0 
  },
  3: { 
    productGross: 66.0, 
    deliveryGross: 2.0,
    productNet: 60.55, 
    deliveryNet: 1.83,
    productVat: 5.45,
    deliveryVat: 0.17,
    totalGross: 68.0 
  },
  4: { 
    productGross: 88.0, 
    deliveryGross: 0.0,
    productNet: 80.73, 
    deliveryNet: 0.0,
    productVat: 7.27,
    deliveryVat: 0.0,
    totalGross: 88.0 
  },
  5: { 
    productGross: 110.0, 
    deliveryGross: 0.0,
    productNet: 100.92, 
    deliveryNet: 0.0,
    productVat: 9.08,
    deliveryVat: 0.0,
    totalGross: 110.0 
  },
}

export async function sendCreapureInvoice(customerData) {
  const { name, email, address, amount } = customerData

  const pricing = PRICING_TIERS[amount]
  if (!pricing) {
    throw new Error(`Invalid quantity: ${amount}`)
  }

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
        quantity: amount,
        priceExVat: pricing.productNet / amount,
        vatRate: 9,
        totalIncVat: pricing.productGross,
      },
      // Only add delivery item if there's a delivery cost
      ...(pricing.deliveryGross > 0 ? [{
        name: "Verzendkosten",
        quantity: 1,
        priceExVat: pricing.deliveryNet,
        vatRate: 9,
        totalIncVat: pricing.deliveryGross,
      }] : []),
    ],
    subtotalExVat: pricing.productNet + pricing.deliveryNet,
    totalVat: pricing.productVat + pricing.deliveryVat,
    totalIncVat: pricing.totalGross,
    note: "Bedankt voor je deelname.",
  }

  const generator = new CustomInvoiceGenerator()
  const pdfBuffer = generator.generateInvoice(invoiceData)


  console.log("Generated PDF Buffer:", pdfBuffer, email, name, amount)
  const result = await resend.emails.send({
    from: "GierigGroeien <info@creapure.gieriggroeien.nl>",
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

  console.log("Email send result:", result)

  return result
}
