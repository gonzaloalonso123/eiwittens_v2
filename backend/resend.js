const { Resend } = require("resend")
const { CustomInvoiceGenerator } = require("./custom-invoice-generator.js")
const { generateInvoiceNumber } = require("./utils.js")
require('dotenv/config');

const resend = new Resend(process.env.RESEND_API_KEY)

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

async function sendCreapureInvoice(customerData) {
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

async function sendReferralProgramEmail(customerData) {
  const { name, email, id } = customerData

  const result = await resend.emails.send({
    from: "GierigGroeien <info@creapure.gieriggroeien.nl>",
    to: email,
    subject: "Claim je persoonlijke Creapure-link & win dikke prijzen!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6;">        
        <h2 style="color: #00BDC6;">Hey ${name},</h2>
        
        <p>Jouw bestelling is binnen – lekker bezig!</p>
        
        <p>Maar… het wordt nog beter. Jij kunt nu prijzen winnen door je vrienden mee te laten doen aan deze actie!</p>
        
        <p>Claim je persoonlijke referral link via de knop hieronder.</p>
        
        <p>Iedere keer dat iemand via jouw link Creapure bestelt, verdien je een extra loterijticket.</p>
        
        <h3 style="color: #ff630d;">Wat kun je winnen?</h3>
        
        <div style="background-color: #f0feff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #00BDC6;">
          <h4 style="color: #00BDC6; margin-top: 0;">Loterijprijzen – iedereen maakt kans:</h4>
          <ul style="margin-bottom: 0;">
            <li>6x potjes pre-workout</li>
            <li>1x 4kg whey protein</li>
            <li>3 maanden gratis coaching</li>
          </ul>
        </div>
        
        <div style="background-color: #fff5f0; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff630d;">
          <p style="margin: 0;"><strong>Leaderboard prijzen</strong> – voor de top 3 mensen met de meeste referrals ligt een extra dikke prijs klaar!</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://gieriggroeien.nl/claim-jouw-unieke-creapure-referral-link?userId=${id}" style="display: inline-block; background-color: #ff630d; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; margin: 5px; box-shadow: 0 4px 15px rgba(0, 189, 198, 0.3);">
            Claim hier jouw link
          </a>
          <br>
        </div>
        
        <p style="background: linear-gradient(135deg, #f0feff, #fff5f0); padding: 15px; border-radius: 8px; text-align: center; border: 2px solid #00BDC6;">
          <strong style="color: #00BDC6;">De actie loopt tot 14 september</strong> – hoe meer vrienden je uitnodigt, hoe meer tickets je verzamelt.
        </p>
        
        <p style="text-align: center; font-size: 18px; color: #ff630d;">
          <strong>Samen maken we Creapure goedkoop in NL. Let's go!</strong>
        </p>
        
        <hr style="border: none; border-top: 2px solid #00BDC6; margin: 30px 0;">
        
        <p style="text-align: center; color: #666;">
          Team GierigGroeien<br>
          <a href="https://www.gieriggroeien.nl" style="color: #00BDC6;">www.gieriggroeien.nl</a>
        </p>
      </div>
    `,
  }).catch((error) => {
    console.error("Error sending referral program email:", error)
  })

  console.log("Referral email send result:", result)

  return result
}

async function sendCreapureUpdateEmail(customerData) {
  const { firstName, email, id, nickname } = customerData

  const referralUrl = nickname
    ? `https://gieriggroeien.nl/creapure-crowdfund-actie/?ref=${nickname}`
    : `https://gieriggroeien.nl/claim-jouw-unieke-creapure-referral-link?userId=${id}`

  const result = await resend.emails.send({
    from: "GierigGroeien <info@creapure.gieriggroeien.nl>",
    to: email,
    subject: "Update: al 334 kg besteld – samen op weg naar 500 kg Creapure",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6;">        
        <h2 style="color: #00BDC6;">Hoi ${firstName},</h2>
        
        <p>Goed nieuws: samen hebben we al 334 kg van de 500 kg Creapure bereikt. De community groeit snel, maar we zijn er nog niet.</p>
        
        <p>Wil je nog een extra kilo toevoegen of vrienden uitnodigen?</p>
        
        <p>Iedere bestelling helpt ons dichter bij de 500 kg.</p>
        
        <p>Via jouw persoonlijke link verdien je bovendien extra loterijtickets.</p>
        
        <div style="background-color: #f0feff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #00BDC6;">
          <p style="margin: 5px 0;"><strong>👉 Deel jouw eigen referral link:</strong></p>
          <a href="${referralUrl}" style="color: #00BDC6; text-decoration: none;">${referralUrl}</a>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://gieriggroeien.nl/creapure-crowdfund-actie-hoeveelheid/" style="display: inline-block; background-color: #ff630d; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; margin: 5px; box-shadow: 0 4px 15px rgba(255, 99, 13, 0.3);">
            Bestel een extra kilo Creapure
          </a>
        </div>
        
        <p style="background: linear-gradient(135deg, #f0feff, #fff5f0); padding: 15px; border-radius: 8px; text-align: center; border: 2px solid #00BDC6;">
          <strong style="color: #00BDC6;">De actie loopt tot 14 september.</strong> Daarna sluiten we de crowdfunding.
        </p>
        
        <p>Bedankt dat je meedoet en helpt Creapure samen betaalbaar te maken in Nederland.</p>
        
        <hr style="border: none; border-top: 2px solid #00BDC6; margin: 30px 0;">
        
        <p style="text-align: center; color: #666;">
          Team GierigGroeien<br>
          <a href="https://www.gieriggroeien.nl" style="color: #00BDC6;">gieriggroeien.nl</a>
        </p>
      </div>
    `,
  }).catch((error) => {
    console.error("Error sending Creapure update email:", error)
  })

  console.log("Creapure update email send result:", result)

  return result
}

module.exports = {
  sendCreapureInvoice,
  sendReferralProgramEmail,
  sendCreapureUpdateEmail,
  sendCreapureLeaderboardEmail: async function (customerData, top5) {
    const { firstName, email, id, nickname } = customerData;

    const referralUrl = nickname
      ? `https://gieriggroeien.nl/creapure-crowdfund-actie/?ref=${nickname}`
      : `https://gieriggroeien.nl/claim-jouw-unieke-creapure-referral-link?userId=${id}`;

    const safeTop = Array.isArray(top5) ? top5.slice(0, 5) : [];
    const listHtml = safeTop
      .map((item, idx) => {
        const name = item?.name ?? item?.nickname ?? `Deelnemer ${idx + 1}`;
        const count = item?.count ?? item?.referrals ?? 0;
        return `<li style="margin: 6px 0;">${idx + 1}. ${name} – ${count} referral${count === 1 ? '' : 's'}</li>`;
      })
      .join("");

    try {
      const result = await resend.emails.send({
        from: "GierigGroeien <info@creapure.gieriggroeien.nl>",
        to: email,
        subject: "Update: dit is de huidige Creapure leaderboard top 5",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6;">
            <h2 style="color: #00BDC6;">Hoi ${firstName},</h2>
            <p>De Creapure crowdfundactie gaat hard – en het wordt spannend op het referral leaderboard. Dit is de huidige top 5:</p>
            <ol style="padding-left: 20px;">
              ${listHtml}
            </ol>
            <p>Wil je stijgen in de ranking? Deel dan je persoonlijke referral-link met je vrienden. Iedere bestelling via jouw link levert je een extra loterijticket op én een hogere plek in het leaderboard.</p>
            <h3 style="color: #ff630d;">Wat valt er te winnen?</h3>
            <ul>
              <li>Extra prijzen voor de top 3 van het leaderboard</li>
              <li>6 potjes pre-workout</li>
              <li>1x 4 kg whey protein</li>
              <li>3 maanden gratis coaching</li>
            </ul>
            <div style="background-color: #f0feff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #00BDC6;">
              <p style="margin: 5px 0;">
                <strong>👉 Bekijk mijn link</strong><br/>
                <a href="${referralUrl}" style="color: #00BDC6; text-decoration: none;">${referralUrl}</a>
              </p>
            </div>
            <p style="background: linear-gradient(135deg, #f0feff, #fff5f0); padding: 15px; border-radius: 8px; text-align: center; border: 2px solid #00BDC6;">
              <strong style="color: #00BDC6;">De actie loopt tot 14 september.</strong> Dit is hét moment om je plek veilig te stellen.
            </p>
            <hr style="border: none; border-top: 2px solid #00BDC6; margin: 30px 0;">
            <p style="text-align: center; color: #666;">
              Team GierigGroeien<br>
              <a href="https://www.gieriggroeien.nl" style="color: #00BDC6;">gieriggroeien.nl</a>
            </p>
          </div>
        `,
      });
      console.log("Leaderboard email send result:", result);
      return result;
    } catch (error) {
      console.error("Error sending leaderboard email:", error);
      throw error;
    }
  },
  sendCreapureThankYouEmail: async function (customerData) {
    const { firstName, email } = customerData;
    try {
      const result = await resend.emails.send({
        from: "GierigGroeien <info@creapure.gieriggroeien.nl>",
        to: email,
        subject: "Bedankt – samen hebben we de 500 kg Creapure gehaald!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6;">
            <h2 style="color: #00BDC6;">Hoi ${firstName},</h2>
            <p>Het is rond: de Creapure-crowdfundactie is vannacht gesloten en we hebben samen de 500 kg gehaald. Iedereen die heeft meegedaan ontvangt z’n bestelling Creapure. 💪</p>

            <div style="background-color: #f0feff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #00BDC6;">
              <p style="margin: 0;">
                <strong>Vandaag, 15 september</strong>, starten we met het verzenden van de orders. Je kunt jouw Creapure binnen 3–4 dagen verwachten. Ook maken we vandaag de winnaars van de loterij bekend.
              </p>
            </div>

            <p>Met deze actie hebben we laten zien dat we samen kunnen opstaan tegen de bizarre marges van grote sportsupplementenmerken. Door de krachten te bundelen, maken we sportsupplementen betaalbaar voor iedereen.</p>

            <p>Bedankt voor je deelname en support – samen bouwen we verder aan een community die slimmer inkoopt en sterker groeit.</p>

            <hr style="border: none; border-top: 2px solid #00BDC6; margin: 30px 0;">
            <p style="text-align: center; color: #666;">
              Team GierigGroeien<br>
              <a href="https://www.gieriggroeien.nl" style="color: #00BDC6;">gieriggroeien.nl</a>
            </p>
          </div>
        `,
      });
      console.log("Thank-you email send result:", result);
      return result;
    } catch (error) {
      console.error("Error sending thank-you email:", error);
      throw error;
    }
  }
}


