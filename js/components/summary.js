// Summary modal
function toggleSummaryModal(show) {
      const modal = document.getElementById('summaryModal');
      if (show) {
        let total = 0;
        const list = document.getElementById('summaryList');
        list.innerHTML = rooms.map(r => {
          const pkg = PACKAGES[r.packageIndex];
          const paintCost = pkg ? r.area * (pkg.rate + r.puttyRate) : 0;
          
          let addonNotes = [];
          let addonCost = 0;

          const d = ADDON_CATALOG.door.find(x => x.id === r.doorSelection.id);
          if (d && d.sqftRate > 0) {
            const doorSqft = (r.doorSelection.width * r.doorSelection.height * 2);
            const cost = Math.round(doorSqft * d.sqftRate) * r.doorSelection.qty;
            addonCost += cost;
            addonNotes.push(`${r.doorSelection.qty}x Door (${r.doorSelection.width}×${r.doorSelection.height}ft) @ ₹${cost}`);
          }

          const g = ADDON_CATALOG.grill.find(x => x.id === r.grillSelection.id);
          if (g && g.sqftRate > 0) {
            const grillSqft = (r.grillSelection.width * r.grillSelection.height);
            const cost = Math.round(grillSqft * g.sqftRate) * r.grillSelection.qty;
            addonCost += cost;
            addonNotes.push(`${r.grillSelection.qty}x Grill (${r.grillSelection.width}×${r.grillSelection.height}ft) @ ₹${cost}`);
          }

          const roomTotal = paintCost + addonCost;
          total += roomTotal;

          return `
            <div class="border-b border-gray-100 pb-2.5">
              <div class="flex justify-between font-bold text-xs text-gray-900">
                <span>${r.name}</span>
                <span>₹ ${roomTotal.toLocaleString('en-IN')}</span>
              </div>
              <p class="text-[11px] text-gray-500 mt-0.5">${pkg ? pkg.name : 'Exterior package not configured'}</p>
              <p class="text-[10px] text-gray-400">${r.area} sq.ft${pkg ? ` @ ₹${pkg.rate + r.puttyRate}/sq.ft` : ''}</p>
              ${addonNotes.length > 0 ? `<p class="text-[10px] text-[#2196F3] font-medium mt-1">+ ${addonNotes.join(' • ')}</p>` : ''}
            </div>
          `;
        }).join('');

        document.getElementById('modalGrandTotal').innerText = `₹ ${total.toLocaleString('en-IN')}`;
        modal.classList.remove('hidden');
      } else {
        modal.classList.add('hidden');
      }
    }
