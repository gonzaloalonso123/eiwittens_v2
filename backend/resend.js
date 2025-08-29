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
  setTimeout(() => {
    sendReferralProgramEmail(customerData).catch((error) => {
      console.error("Error sending referral email:", error)
    })
  }, 3 * 60 * 1000)

  return result
}

export async function sendReferralProgramEmail(customerData) {
  const { name, email, id } = customerData

  const result = await resend.emails.send({
    from: "GierigGroeien <info@creapure.gieriggroeien.nl>",
    to: email,
    subject: "Jouw unieke Creapure-link is klaar",
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6;">
      <h2 style="color: #2c3e50;">Hi ${name},</h2>

      <p>Je bestelling is succesvol ontvangen – dank je wel!</p>

      <p>We hebben iets extra's voor je: een persoonlijke link waarmee je vrienden kunt uitnodigen voor onze actie.</p>

      <p>Voor elke vriend die bestelt via jouw link, krijg je een extra ticket voor de loterij.</p>

      <h3 style="color: #2c3e50;">Wat kun je winnen?</h3>
      <ul>
        <li>6x pre-workout potjes</li>
        <li>1x 4kg whey protein</li>
        <li>3 maanden gratis coaching</li>
      </ul>

      <p>Voor de top 3 deelnemers met de meeste referrals is er ook een extra beloning.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://gieriggroeien.nl/claim-jouw-unieke-creapure-referral-link?userId=${id}" style="display: inline-block; background-color: #e74c3c; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: bold;">
          Jouw unieke link
        </a>
      </div>

      <p style="text-align: center;">De actie loopt tot 14 september.</p>

      <p style="text-align: center; color: #2c3e50;"><strong>Bedankt voor je support!</strong></p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

      <p style="text-align: center; color: #666;">
        Team GierigGroeien<br>
        <a href="https://www.gieriggroeien.nl" style="color: #3498db;">www.gieriggroeien.nl</a>
      </p>
    </div>
  `,
}).catch ((error) => {
  console.error("Error sending referral program email:", error)
})

console.log("Referral email send result:", result)

return result
}


