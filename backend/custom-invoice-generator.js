import { jsPDF } from "jspdf"

export class CustomInvoiceGenerator {
    constructor() {
        this.doc = new jsPDF()
        this.pageWidth = this.doc.internal.pageSize.width
        this.pageHeight = this.doc.internal.pageSize.height
        this.margin = 20
    }

    generateInvoice(data) {
        this.addHeader(data)
        this.addCompanyInfo(data.company)
        this.addCustomerInfo(data.customer)
        this.addInvoiceDetails(data)
        this.addItemsTable(data.items)
        this.addTotals(data)
        this.addFooter(data)

        return Buffer.from(this.doc.output("arraybuffer"))
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
        this.doc.text(company.name, this.margin, 30)

        this.doc.setFontSize(10)
        this.doc.setFont("helvetica", "normal")
        this.doc.text(company.email, this.margin, 45)
        this.doc.text(company.website, this.margin, 55)
        this.doc.text(company.taxId, this.margin, 65)
        this.doc.text(company.kvk, this.margin, 75)
    }

    addCustomerInfo(customer) {
        this.doc.setFontSize(12)
        this.doc.setFont("helvetica", "bold")
        this.doc.text("Factureren aan:", this.margin, 100)

        this.doc.setFont("helvetica", "normal")
        this.doc.text(customer.name, this.margin, 115)

        // Handle multi-line address
        const addressLines = customer.address.split("\n")
        let yPos = 125
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
        const startY = 170
        const rowHeight = 15

        // Table headers
        this.doc.setFontSize(10)
        this.doc.setFont("helvetica", "bold")

        this.doc.text("Artikel", this.margin, startY)
        this.doc.text("Aantal", this.margin + 80, startY)
        this.doc.text("Prijs ex. BTW", this.margin + 110, startY)
        this.doc.text("BTW", this.margin + 150, startY)
        this.doc.text("Totaal", this.pageWidth - this.margin - 20, startY)

        // Draw header line
        this.doc.line(this.margin, startY + 5, this.pageWidth - this.margin, startY + 5)

        // Table rows
        this.doc.setFont("helvetica", "normal")
        let currentY = startY + rowHeight

        items.forEach((item) => {
            this.doc.text(item.name, this.margin, currentY)
            this.doc.text(item.quantity.toString(), this.margin + 80, currentY)
            this.doc.text(`€${item.priceExVat.toFixed(2)}`, this.margin + 110, currentY)
            this.doc.text(`${item.vatRate}%`, this.margin + 150, currentY)
            this.doc.text(`€${item.totalIncVat.toFixed(2)}`, this.pageWidth - this.margin - 20, currentY, { align: "right" })
            currentY += rowHeight
        })

        // Draw bottom line
        this.doc.line(this.margin, currentY, this.pageWidth - this.margin, currentY)
    }

    addTotals(data) {
        const startY = 240
        const rightAlign = this.pageWidth - this.margin - 20

        this.doc.setFontSize(10)
        this.doc.setFont("helvetica", "normal")

        this.doc.text("Subtotaal ex. BTW:", rightAlign - 60, startY)
        this.doc.text(`€${data.subtotalExVat.toFixed(2)}`, rightAlign, startY, { align: "right" })

        this.doc.text("Totaal BTW:", rightAlign - 60, startY + 15)
        this.doc.text(`€${data.totalVat.toFixed(2)}`, rightAlign, startY + 15, { align: "right" })

        this.doc.setFont("helvetica", "bold")
        this.doc.text("Totaal inc. BTW:", rightAlign - 60, startY + 30)
        this.doc.text(`€${data.totalIncVat.toFixed(2)}`, rightAlign, startY + 30, { align: "right" })
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
