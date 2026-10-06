// PDF generation + WhatsApp handoff
async function shareWhatsApp() {
      const shareButton = document.querySelector('[onclick="shareWhatsApp()"]');
      const originalButtonHTML = shareButton ? shareButton.innerHTML : '';
      const targetWhatsApp = '917204948579';

      try {
        if (!window.jspdf || !window.jspdf.jsPDF) {
          alert('PDF generator is still loading. Please try again in a moment.');
          return;
        }

        if (shareButton) {
          shareButton.disabled = true;
          shareButton.innerHTML = '<i class="fa-solid fa-file-pdf mr-1"></i> Preparing PDF...';
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 16;
        let y = 18;
        const blue = [33, 150, 243];
        const gray = [125, 128, 128];

        const money = value => `Rs. ${Math.round(value).toLocaleString('en-IN')}`;
        const addText = (value, x, yy, size = 10, style = 'normal', color = [0,0,0]) => {
          doc.setFont('helvetica', style);
          doc.setFontSize(size);
          doc.setTextColor(...color);
          doc.text(String(value), x, yy);
        };
        const ensureSpace = needed => {
          if (y + needed > pageHeight - 16) {
            doc.addPage();
            y = 18;
          }
        };

        // Header
        doc.setFillColor(...blue);
        doc.roundedRect(margin, y, pageWidth - margin * 2, 22, 3, 3, 'F');
        addText('PAINTING QUOTATION', margin + 7, y + 9, 15, 'bold', [255,255,255]);
        addText(`${paintScope === 'interior' ? 'Interior' : 'Exterior'} • ${isVacant ? 'Vacant House' : 'Occupied / Furnished'}`, margin + 7, y + 16, 8.5, 'normal', [255,255,255]);
        y += 31;

        addText('Customer Details', margin, y, 11, 'bold', blue);
        y += 7;
        addText(`Customer: ${customerName || '-'}`, margin, y, 9.5);
        y += 5.5;
        addText(`Mobile: ${customerMobile || '-'}`, margin, y, 9.5);
        y += 5.5;
        addText(`Quotation Type: ${paintScope === 'interior' ? 'Interior' : 'Exterior'}`, margin, y, 9.5);
        y += 5.5;
        addText(`Property Status: ${isVacant ? 'Vacant House' : 'Occupied / Furnished'}`, margin, y, 9.5);
        y += 10;

        let grandTotal = 0;
        rooms.forEach((r, index) => {
          const pkg = PACKAGES[r.packageIndex];
          const paintCost = pkg ? r.area * (pkg.rate + r.puttyRate) : 0;
          let addonCost = 0;
          const addonDetails = [];

          const d = ADDON_CATALOG.door.find(x => x.id === r.doorSelection.id);
          if (d && d.sqftRate > 0) {
            const doorSqft = r.doorSelection.width * r.doorSelection.height * 2;
            const cost = Math.round(doorSqft * d.sqftRate) * r.doorSelection.qty;
            addonCost += cost;
            addonDetails.push(`${r.doorSelection.qty}x Door - ${d.name} (${r.doorSelection.width}x${r.doorSelection.height} ft) - ${money(cost)}`);
          }

          const g = ADDON_CATALOG.grill.find(x => x.id === r.grillSelection.id);
          if (g && g.sqftRate > 0) {
            const grillSqft = r.grillSelection.width * r.grillSelection.height;
            const cost = Math.round(grillSqft * g.sqftRate) * r.grillSelection.qty;
            addonCost += cost;
            addonDetails.push(`${r.grillSelection.qty}x Grill - ${g.name} (${r.grillSelection.width}x${r.grillSelection.height} ft) - ${money(cost)}`);
          }

          const roomTotal = paintCost + addonCost;
          grandTotal += roomTotal;
          ensureSpace(38 + addonDetails.length * 5);

          doc.setFillColor(247, 251, 255);
          doc.roundedRect(margin, y, pageWidth - margin * 2, 31 + addonDetails.length * 5, 2.5, 2.5, 'F');
          addText(`${index + 1}. ${r.name}`, margin + 5, y + 7, 10.5, 'bold');
          addText(money(roomTotal), pageWidth - margin - 5, y + 7, 10.5, 'bold', blue);
          addText(`Area: ${r.area} sq.ft`, margin + 5, y + 13, 8.5, 'normal', gray);
          addText(`Package: ${pkg ? pkg.name : 'Exterior package not configured'}`, margin + 5, y + 18.5, 8.5);
          if (pkg) addText(`Paint rate + putty: ${money(pkg.rate + r.puttyRate)}/sq.ft`, margin + 5, y + 24, 8.5, 'normal', gray);
          if (addonDetails.length) {
            addonDetails.forEach((detail, i) => addText(`Add-on: ${detail}`, margin + 5, y + 29 + i * 5, 7.8, 'normal', gray));
          }
          y += 36 + addonDetails.length * 5;
        });

        ensureSpace(30);
        doc.setDrawColor(...blue);
        doc.line(margin, y, pageWidth - margin, y);
        y += 9;
        addText('GRAND TOTAL', margin, y, 11, 'bold', gray);
        addText(money(grandTotal), pageWidth - margin, y, 15, 'bold', blue);
        y += 8;
        addText('Generated via Partner Portal', margin, y, 8, 'normal', gray);

        const safeName = (customerName || 'Customer').replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '');
        const fileName = `Painting_Quotation_${safeName || 'Customer'}.pdf`;
        doc.save(fileName);

        const whatsappMessage = `Hello, please find the painting quotation for ${customerName || 'the customer'}. The quotation PDF has been generated and downloaded. Please attach the downloaded PDF to this chat.`;
        window.open(`https://wa.me/${targetWhatsApp}?text=${encodeURIComponent(whatsappMessage)}`, '_blank');

        alert(`Quotation PDF downloaded. WhatsApp chat opened for +91 ${targetWhatsApp.slice(2)}. Please attach the downloaded PDF and send it.`);
      } catch (error) {
        console.error('Quotation PDF error:', error);
        alert('Could not generate the quotation PDF. Please try again.');
      } finally {
        if (shareButton) {
          shareButton.disabled = false;
          shareButton.innerHTML = originalButtonHTML;
        }
      }
    }

