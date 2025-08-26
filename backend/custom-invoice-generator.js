import { jsPDF } from "jspdf"
import fs from "fs"
import path from "path"

export class CustomInvoiceGenerator {
  constructor() {
    this.doc = new jsPDF()
    this.pageWidth = this.doc.internal.pageSize.width
    this.pageHeight = this.doc.internal.pageSize.height
    this.margin = 20
  }

  generateInvoice(data) {
    this.addLogo()
    this.addHeader(data)
    this.addCompanyInfo(data.company)
    this.addCustomerInfo(data.customer)
    this.addInvoiceDetails(data)
    this.addItemsTable(data.items)
    this.addTotals(data)
    this.addFooter(data)

    return Buffer.from(this.doc.output("arraybuffer"))
  }

  addLogo() {
    try {
      const logoPath = path.join(process.cwd(), "images", "logo.png")
      const logoBuffer = fs.readFileSync(logoPath)
      const logoBase64 = logoBuffer.toString("base64")

      // Add the logo image to the PDF
      this.doc.addImage(`data:image/png;base64,${logoBase64}`, "PNG", this.margin, 15, 40, 20)
    } catch (error) {
      console.log("[v0] Logo loading failed, using placeholder:", error.message)
      this.doc.setDrawColor(200, 200, 200)
      this.doc.setFillColor(240, 240, 240)
      this.doc.rect(this.margin, 15, 40, 20, "FD")

      this.doc.setFontSize(8)
      this.doc.setTextColor(100, 100, 100)
      this.doc.text("LOGO", this.margin + 20, 27, { align: "center" })
      this.doc.setTextColor(0, 0, 0) // Reset to black
    }
  }

  addHeader(data) {
    this.doc.setFontSize(24)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("F A C T U U R", this.pageWidth - this.margin, 30, { align: "right" })

    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "normal")
    this.doc.text(`Referentienummer: ${data.invoiceNumber}`, this.pageWidth - this.margin, 45, { align: "right" })
    this.doc.text(`Datum: ${data.date}`, this.pageWidth - this.margin, 55, { align: "right" })
    this.doc.text("Status: Betaald!", this.pageWidth - this.margin, 65, { align: "right" })
  }

  addCompanyInfo(company) {
    this.doc.setFontSize(14)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(company.name, this.margin, 45)

    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "normal")
    this.doc.text(`Mail: ${company.email}`, this.margin, 55)
    this.doc.text(`Web: ${company.website}`, this.margin, 65)
    this.doc.text(`BTW: ${company.taxId}`, this.margin, 75)
    this.doc.text(`KVK: ${company.kvk}`, this.margin, 85)
  }

  addCustomerInfo(customer) {
    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("Factureren aan:", this.margin, 110)

    this.doc.setFont("helvetica", "normal")
    this.doc.text(customer.name, this.margin, 125)

    // Handle multi-line address
    const addressLines = customer.address.split(", ")
    let yPos = 135
    addressLines.forEach((line) => {
      this.doc.text(line, this.margin, yPos)
      yPos += 10
    })

    this.doc.text(customer.email, this.margin, yPos + 5)
  }

  addInvoiceDetails(data) {
    // This method can be extended for additional invoice details if needed
  }

  addItemsTable(items) {
    const startY = 180
    const rowHeight = 12
    const colWidths = {
      artikel: 60,
      aantal: 25,
      prijsEx: 35,
      btw: 20,
      totaal: 35,
    }

    let xPos = this.margin

    // Table headers with background
    this.doc.setFillColor(240, 240, 240)
    this.doc.rect(this.margin, startY - 8, this.pageWidth - 2 * this.margin, rowHeight, "F")

    this.doc.setFontSize(9)
    this.doc.setFont("helvetica", "bold")

    this.doc.text("Artikel", xPos + 2, startY)
    xPos += colWidths.artikel
    this.doc.text("Aantal", xPos + 2, startY)
    xPos += colWidths.aantal
    this.doc.text("Prijs ex. BTW", xPos + 2, startY)
    xPos += colWidths.prijsEx
    this.doc.text("BTW", xPos + 2, startY)
    xPos += colWidths.btw
    this.doc.text("Totaal", xPos + 2, startY)

    // Draw header border
    this.doc.setDrawColor(200, 200, 200)
    this.doc.rect(this.margin, startY - 8, this.pageWidth - 2 * this.margin, rowHeight)

    // Table rows
    this.doc.setFont("helvetica", "normal")
    let currentY = startY + rowHeight

    items.forEach((item, index) => {
      xPos = this.margin

      // Alternate row background
      if (index % 2 === 1) {
        this.doc.setFillColor(250, 250, 250)
        this.doc.rect(this.margin, currentY - 8, this.pageWidth - 2 * this.margin, rowHeight, "F")
      }

      this.doc.text(item.name, xPos + 2, currentY)
      xPos += colWidths.artikel
      this.doc.text(item.amount.toString(), xPos + 2, currentY)
      xPos += colWidths.aantal
      this.doc.text(`€${item.priceExVat.toFixed(2)}`, xPos + 2, currentY)
      xPos += colWidths.prijsEx
      this.doc.text(`${item.vatRate}%`, xPos + 2, currentY)
      xPos += colWidths.btw
      this.doc.text(`€${item.totalIncVat.toFixed(2)}`, xPos + 2, currentY)

      // Draw row border
      this.doc.setDrawColor(220, 220, 220)
      this.doc.rect(this.margin, currentY - 8, this.pageWidth - 2 * this.margin, rowHeight)

      currentY += rowHeight
    })
  }

  addTotals(data) {
    const startY = 250
    const rightAlign = this.pageWidth - this.margin - 5
    const labelX = rightAlign - 70

    this.doc.setFontSize(10)
    this.doc.setFont("helvetica", "normal")

    this.doc.text("Subtotaal ex. BTW:", labelX, startY)
    this.doc.text(`€${data.subtotalExVat.toFixed(2)}`, rightAlign, startY, { align: "right" })

    this.doc.text("Totaal BTW:", labelX, startY + 12)
    this.doc.text(`€${data.totalVat.toFixed(2)}`, rightAlign, startY + 12, { align: "right" })

    // Draw line above total
    this.doc.setDrawColor(0, 0, 0)
    this.doc.line(labelX, startY + 20, rightAlign, startY + 20)

    this.doc.setFont("helvetica", "bold")
    this.doc.text("Totaal inc. BTW:", labelX, startY + 28)
    this.doc.text(`€${data.totalIncVat.toFixed(2)}`, rightAlign, startY + 28, { align: "right" })
  }

  addFooter(data) {
    if (data.note) {
      this.doc.setFontSize(10)
      this.doc.setFont("helvetica", "normal")
      this.doc.text(data.note, this.margin, this.pageHeight - 40)
    }

    // Add QR code placeholder or any other footer elements
    this.doc.setFontSize(8)
    this.doc.text("https://www.gieriggroeien.nl", this.margin, this.pageHeight - 20)
  }
}
