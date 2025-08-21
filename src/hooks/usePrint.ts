import { useCallback } from 'react';
import { usePosStore } from '../store';

export function usePrint() {
  const { cart, getCartTotal, paymentMethod } = usePosStore();

  const printReceipt = useCallback(() => {
    const { subtotal, tax, total } = getCartTotal();
    const orderNumber = `#${Date.now().toString().slice(-4)}`;
    const timestamp = new Date().toLocaleString();

    // Create receipt content
    const receiptContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt ${orderNumber}</title>
          <style>
            @media print {
              body { 
                font-family: 'Courier New', monospace;
                font-size: 12px;
                line-height: 1.4;
                margin: 0;
                padding: 20px;
                width: 300px;
              }
              .header {
                text-align: center;
                border-bottom: 2px solid #000;
                padding-bottom: 10px;
                margin-bottom: 15px;
              }
              .order-info {
                margin-bottom: 15px;
              }
              .items {
                border-bottom: 1px solid #000;
                padding-bottom: 10px;
                margin-bottom: 10px;
              }
              .item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
              }
              .totals {
                margin-top: 10px;
              }
              .total-line {
                display: flex;
                justify-content: space-between;
                margin-bottom: 3px;
              }
              .final-total {
                border-top: 1px solid #000;
                padding-top: 5px;
                font-weight: bold;
                font-size: 14px;
              }
              .footer {
                text-align: center;
                margin-top: 20px;
                border-top: 1px solid #000;
                padding-top: 10px;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>CAFE POS</h2>
            <p>Order Receipt</p>
          </div>
          
          <div class="order-info">
            <div><strong>Order:</strong> ${orderNumber}</div>
            <div><strong>Date:</strong> ${timestamp}</div>
            <div><strong>Payment:</strong> ${paymentMethod.toUpperCase()}</div>
          </div>
          
          <div class="items">
            <h3>Items:</h3>
            ${cart.map(item => `
              <div class="item">
                <div>
                  <div>${item.product.name}</div>
                  <div style="font-size: 10px; color: #666;">
                    ${item.quantity} x ₹${item.product.price.toFixed(2)}
                  </div>
                </div>
                <div>₹${(item.product.price * item.quantity).toFixed(2)}</div>
              </div>
            `).join('')}
          </div>
          
          <div class="totals">
            <div class="total-line">
              <span>Subtotal:</span>
              <span>₹${subtotal.toFixed(2)}</span>
            </div>
            <div class="total-line">
              <span>Tax:</span>
              <span>₹${tax.toFixed(2)}</span>
            </div>
            <div class="total-line final-total">
              <span>Total:</span>
              <span>₹${total.toFixed(2)}</span>
            </div>
          </div>
          
          <div class="footer">
            <p>Thank you for your visit!</p>
            <p>Have a great day!</p>
          </div>
        </body>
      </html>
    `;

    // Open new window and print
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptContent);
      printWindow.document.close();
      printWindow.focus();
      
      // Wait for content to load then print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  }, [cart, getCartTotal, paymentMethod]);

  return { printReceipt };
}