import { formatIndianCurrency } from '@/utils/currency';
import type { Order } from './orderService';

class InvoiceService {
  async generateInvoice(order: Order, customerInfo: any): Promise<string> {
    const invoiceDate = new Date().toLocaleDateString('en-IN');
    const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN');

    const itemsHtml = order.items
      .map(
        (item, index) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${
          index + 1
        }</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${
          item.productId?.name || 'Product'
        }</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${
          item.quantity
        }</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatIndianCurrency(
          item.price
        )}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${formatIndianCurrency(
          item.price * item.quantity
        )}</td>
      </tr>
    `
      )
      .join('');

    const subtotal = order.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const deliveryFee = subtotal > 500 ? 0 : 40;
    const total = subtotal + deliveryFee;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice - GreenMart</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background-color: #f9fafb;
            color: #1f2937;
          }
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header { 
            background: linear-gradient(135deg, #27AE60, #2ECC71);
            color: white;
            text-align: center; 
            padding: 30px 20px;
          }
          .company-name { 
            font-size: 36px; 
            font-weight: bold; 
            margin-bottom: 8px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .tagline { 
            font-size: 18px; 
            opacity: 0.9;
            margin-bottom: 20px;
          }
          .eco-badge {
            display: inline-block;
            background: rgba(255,255,255,0.2);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
          }
          .invoice-title { 
            font-size: 28px; 
            font-weight: bold; 
            margin-top: 20px;
            letter-spacing: 2px;
          }
          .content {
            padding: 30px;
          }
          .invoice-info { 
            display: flex; 
            justify-content: space-between; 
            margin: 30px 0;
            gap: 40px;
          }
          .invoice-details, .customer-details { 
            flex: 1;
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #27AE60;
          }
          .section-title { 
            font-weight: bold; 
            color: #27AE60; 
            margin-bottom: 15px;
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .detail-item {
            margin-bottom: 8px;
            font-size: 14px;
            line-height: 1.5;
          }
          .table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 30px 0;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .table th { 
            background: #27AE60; 
            color: white; 
            padding: 15px 12px; 
            text-align: left;
            font-weight: 600;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .table td { 
            padding: 12px; 
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
          }
          .table tr:hover {
            background-color: #f9fafb;
          }
          .total-section { 
            margin-top: 30px; 
            text-align: right;
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
          }
          .total-row { 
            margin: 8px 0;
            font-size: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .total-label {
            font-weight: 500;
          }
          .total-value {
            font-weight: 600;
            min-width: 120px;
            text-align: right;
          }
          .final-total { 
            font-size: 20px; 
            font-weight: bold; 
            color: #27AE60;
            border-top: 2px solid #27AE60;
            padding-top: 15px;
            margin-top: 15px;
          }
          .footer { 
            margin-top: 40px; 
            text-align: center; 
            color: #6b7280; 
            font-size: 14px;
            padding: 20px;
            background: #f8fafc;
            border-radius: 8px;
          }
          .thank-you {
            font-size: 18px;
            font-weight: 600;
            color: #27AE60;
            margin-bottom: 8px;
          }
          .eco-message {
            font-style: italic;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <div class="company-name">🌱 GreenMart</div>
            <div class="tagline">Eco-Friendly Grocery Shopping</div>
            <div class="eco-badge">🌍 Sustainable • Organic • Fresh</div>
            <div class="invoice-title">INVOICE</div>
          </div>

          <div class="content">
            <div class="invoice-info">
              <div class="invoice-details">
                <div class="section-title">📋 Invoice Details</div>
                <div class="detail-item"><strong>Invoice No:</strong> #${order._id.slice(
                  -8
                )}</div>
                <div class="detail-item"><strong>Invoice Date:</strong> ${invoiceDate}</div>
                <div class="detail-item"><strong>Order Date:</strong> ${orderDate}</div>
                <div class="detail-item"><strong>Status:</strong> <span style="color: #27AE60; font-weight: 600;">${order.status.toUpperCase()}</span></div>
                <div class="detail-item"><strong>Payment:</strong> ${
                  order.paymentMethod?.toUpperCase() || 'PENDING'
                }</div>
              </div>
              <div class="customer-details">
                <div class="section-title">👤 Customer Details</div>
                <div class="detail-item"><strong>Name:</strong> ${
                  customerInfo.name
                }</div>
                <div class="detail-item"><strong>Email:</strong> ${
                  customerInfo.email
                }</div>
                <div class="detail-item"><strong>Phone:</strong> ${
                  customerInfo.phone
                }</div>
                ${
                  order.deliveryAddress
                    ? `<div class="detail-item"><strong>Address:</strong><br>${
                        typeof order.deliveryAddress === 'object'
                          ? `${order.deliveryAddress.street}<br>${order.deliveryAddress.city}, ${order.deliveryAddress.state} - ${order.deliveryAddress.zipCode}<br>${order.deliveryAddress.country}`
                          : order.deliveryAddress
                      }</div>`
                    : ''
                }
              </div>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th style="width: 60px;">S.No</th>
                  <th>Item Description</th>
                  <th style="width: 80px; text-align: center;">Qty</th>
                  <th style="width: 100px; text-align: right;">Rate</th>
                  <th style="width: 120px; text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="total-section">
              <div class="total-row">
                <span class="total-label">Subtotal:</span>
                <span class="total-value">${formatIndianCurrency(
                  subtotal
                )}</span>
              </div>
              <div class="total-row">
                <span class="total-label">Delivery Fee:</span>
                <span class="total-value">${
                  deliveryFee === 0
                    ? 'FREE 🎉'
                    : formatIndianCurrency(deliveryFee)
                }</span>
              </div>
              ${
                deliveryFee === 0
                  ? '<div style="font-size: 12px; color: #27AE60; text-align: right; margin: 5px 0;">🌟 Free delivery on orders above ₹500</div>'
                  : ''
              }
              <div class="total-row final-total">
                <span class="total-label">Total Amount:</span>
                <span class="total-value">${formatIndianCurrency(total)}</span>
              </div>
            </div>

            <div class="footer">
              <div class="thank-you">🙏 Thank you for choosing GreenMart!</div>
              <div>Making grocery shopping sustainable, one order at a time</div>
              <div class="eco-message">🌱 Every purchase helps reduce carbon footprint • Choose eco-friendly packaging</div>
              <div style="margin-top: 15px; font-size: 12px;">
                📞 Support: aravindv939@gmail.com| 🌐 www.Greenmart-Aravind.com
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return htmlContent;
  }

  async shareInvoice(invoiceContent: string): Promise<void> {
    try {
      // Create a data URL for the HTML content
      const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(
        invoiceContent
      )}`;

      // Create a temporary link element
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `GreenMart-Invoice-${Date.now()}.html`;

      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('Invoice download initiated successfully');
    } catch (error) {
      console.error('Error sharing invoice:', error);
      throw new Error('Failed to download invoice');
    }
  }
}

export const invoiceService = new InvoiceService();
