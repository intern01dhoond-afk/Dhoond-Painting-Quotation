# Dhoond Painting Quotation

## What was fixed

- The customer preview is now the **single source of truth** for the customer PDF.
- Downloaded/shared PDFs are rendered from the same quotation-preview DOM and CSS, instead of a separate PDF layout.
- The quotation data shown in Preview is reused for the PDF, preventing the PDF from falling back to zero/default room values.
- Quotation number is reused between Preview, Download and Send so they refer to the same quote.
- Indian Rupee (`₹`) rendering is handled by the browser renderer rather than jsPDF's Helvetica font, avoiding the previous `¹` character problem.
- Added **Download PDF** and **Send Quote** actions to the customer preview toolbar.
- Mobile sharing uses the native share sheet with the PDF file attached when supported.
- Desktop WhatsApp Web still cannot receive an automatically attached local file from a normal browser; the exact PDF is downloaded and WhatsApp is opened with the prepared message.

## Run locally

```bash
python -m http.server 5500
```

Then open:

`http://localhost:5500`

## Important

The PDF renderer uses `html2canvas` and `jsPDF` from CDN. An internet connection is required when first loading the page unless those libraries are self-hosted.
