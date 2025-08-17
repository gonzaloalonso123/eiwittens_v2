function createCreapureReferralEmail({ name, referralLink }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Creapure Referral - ${name}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Inter', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, rgba(255, 99, 13, 0.05) 0%, rgba(255, 99, 13, 0.02) 100%);
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/background-cJjBaOsGXQgC5ETJasUZZhOG9qabds.webp') center/cover;
            position: relative;
        }
        .email-overlay {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            min-height: 100vh;
        }
        .header {
            text-align: center;
            padding: 40px 30px;
            background: linear-gradient(135deg, #FF630D 0%, #FF8A3D 100%);
            color: white;
        }
        .header h1 {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header p {
            font-size: 18px;
            font-weight: 400;
            opacity: 0.95;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 20px;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 24px;
            text-align: center;
        }
        .description {
            font-size: 16px;
            color: #555;
            margin-bottom: 32px;
            text-align: center;
            line-height: 1.7;
        }
        .stories-section {
            margin-bottom: 40px;
        }
        .stories-grid {
            display: flex;
            flex-direction: column;
            gap: 20px;
            margin-bottom: 32px;
        }
        
        .story-item {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            border: 1px solid rgba(255, 99, 13, 0.1);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .story-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        }
        
        .story-title {
            font-size: 18px;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 8px;
        }
        
        .story-description {
            font-size: 14px;
            color: #666;
            margin-bottom: 16px;
            line-height: 1.5;
        }
        
        .download-btn {
            display: inline-block;
            background: linear-gradient(135deg, #FF630D 0%, #FF8A3D 100%);
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.2s ease;
            box-shadow: 0 2px 8px rgba(255, 99, 13, 0.3);
        }
        
        .download-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 16px rgba(255, 99, 13, 0.4);
            text-decoration: none;
            color: white;
        }
        
        .sharing-section {
            background: white;
            border-radius: 16px;
            padding: 32px;
            margin-bottom: 40px;
            box-shadow: 0 6px 20px rgba(0,0,0,0.08);
            border: 1px solid rgba(255, 99, 13, 0.1);
        }
        
        .sharing-title {
            font-size: 22px;
            font-weight: 700;
            color: #2c3e50;
            margin-bottom: 16px;
            text-align: center;
        }
        
        .sharing-description {
            font-size: 16px;
            color: #555;
            margin-bottom: 24px;
            text-align: center;
            line-height: 1.6;
        }
        
        .referral-link {
            background: #f8f9fa;
            border: 2px dashed #FF630D;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 24px;
            text-align: center;
        }
        
        .referral-link code {
            font-family: 'Courier New', monospace;
            font-size: 14px;
            color: #FF630D;
            font-weight: 600;
            word-break: break-all;
        }
        
        .social-buttons {
            display: flex;
            justify-content: center;
            gap: 16px;
            flex-wrap: wrap;
        }
        
        .social-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 12px 20px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.2s ease;
            color: white;
        }
        
        .whatsapp { background: #25D366; }
        .twitter { background: #1DA1F2; }
        .facebook { background: #1877F2; }
        
        .social-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            text-decoration: none;
            color: white;
        }
        
        .contact-section {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 40px;
            text-align: center;
        }
        
        .contact-title {
            font-size: 18px;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 12px;
        }
        
        .contact-info {
            font-size: 14px;
            color: #666;
            line-height: 1.6;
        }
        
        .contact-info a {
            color: #FF630D;
            text-decoration: none;
            font-weight: 500;
        }
        
        .contact-info a:hover {
            text-decoration: underline;
        }
        
        .goodbye-section {
            text-align: center;
            padding: 40px 30px;
            background: linear-gradient(135deg, rgba(255, 99, 13, 0.05) 0%, rgba(255, 99, 13, 0.02) 100%);
        }
        
        .vulture-container {
            margin-bottom: 20px;
        }
        
        .vulture-image {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
            transition: transform 0.3s ease;
        }
        
        .vulture-image:hover {
            transform: scale(1.05);
        }
        
        .goodbye-text {
            font-size: 18px;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 8px;
        }
        
        .goodbye-subtitle {
            font-size: 14px;
            color: #666;
            font-style: italic;
        }
        
        @media (max-width: 600px) {
            .email-container {
                margin: 0;
            }
            
            .header, .content, .goodbye-section {
                padding: 30px 20px;
            }
            
            .header h1 {
                font-size: 28px;
            }
            
            .social-buttons {
                flex-direction: column;
                align-items: center;
            }
            
            .social-btn {
                width: 200px;
                justify-content: center;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-overlay">
            <!-- Header -->
            <div class="header">
                <h1>You are a Gierig now</h1>
                <p>Welcome to the Creapure community</p>
            </div>
            
            <!-- Main Content -->
            <div class="content">
                <div class="greeting">
                    Hallo ${name}!
                </div>
                
                <div class="description">
                    Bedankt voor je deelname aan onze Creapure crowdfund! Hier zijn je verhalen om te downloaden en te delen.
                </div>
                
                <!-- Stories Section -->
                <div class="stories-section">
                    <div class="stories-grid">
                        <div class="story-item">
                            <div class="story-title">Story 1: De Ontdekking</div>
                            <div class="story-description">Het verhaal van hoe Creapure werd ontdekt en ontwikkeld.</div>
                            <a href="#" class="download-btn">Download Story 1</a>
                        </div>
                        
                        <div class="story-item">
                            <div class="story-title">Story 2: De Wetenschap</div>
                            <div class="story-description">Wetenschappelijke achtergrond en onderzoek achter Creapure.</div>
                            <a href="#" class="download-btn">Download Story 2</a>
                        </div>
                        
                        <div class="story-item">
                            <div class="story-title">Story 3: De Toekomst</div>
                            <div class="story-description">Onze visie voor de toekomst van Creapure supplementen.</div>
                            <a href="#" class="download-btn">Download Story 3</a>
                        </div>
                    </div>
                </div>
                
                <!-- Sharing Section -->
                <div class="sharing-section">
                    <div class="sharing-title">Deel je referral link</div>
                    <div class="sharing-description">
                        Help ons groeien door je persoonlijke referral link te delen met vrienden en familie.
                    </div>
                    
                    <div class="referral-link">
                        <code>${referralLink}</code>
                    </div>
                    
                    <div class="social-buttons">
                        <a href="https://wa.me/?text=Check%20out%20Creapure%20crowdfund:%20${encodeURIComponent(referralLink)}" class="social-btn whatsapp">
                            📱 WhatsApp
                        </a>
                        <a href="https://twitter.com/intent/tweet?text=Join%20me%20in%20the%20Creapure%20crowdfund!&url=${encodeURIComponent(referralLink)}" class="social-btn twitter">
                            🐦 Twitter
                        </a>
                        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}" class="social-btn facebook">
                            📘 Facebook
                        </a>
                    </div>
                </div>
                
                <!-- Contact Section -->
                <div class="contact-section">
                    <div class="contact-title">Vragen of hulp nodig?</div>
                    <div class="contact-info">
                        Neem contact met ons op via<br>
                        <a href="mailto:support@creapure.com">support@creapure.com</a><br>
                        of bel ons op <a href="tel:+31123456789">+31 12 345 6789</a>
                    </div>
                </div>
            </div>
            
            <!-- Goodbye Section with Vulture -->
            <div class="goodbye-section">
                <div class="vulture-container">
                    <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/rogier-in-circle-WF0lsBTPY2LhRPug6vvhji4zhkUZmP.webp" alt="Rogier says goodbye" class="vulture-image">
                </div>
                <div class="goodbye-text">Tot de volgende keer!</div>
                <div class="goodbye-subtitle">- Rogier & het Creapure team</div>
            </div>
        </div>
    </div>
</body>
</html>
  `
}

// Export for use
module.exports = { createCreapureReferralEmail }

// Example usage:
// const emailHtml = createCreapureReferralEmail({
//   name: "Jan",
//   referralLink: "https://creapure.com/ref/jan123"
// });
