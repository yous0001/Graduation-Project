export const verificationEmailTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Our Food App</title>
    <style>
        body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f9f9f9;
        color: #333;
        }
        .email-container {
        max-width: 600px;
        margin: 20px auto;
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        }
        .header {
        background-color: #ff7f50; /* Orange color */
        color: #fff;
        text-align: center;
        padding: 20px;
        }
        .header h1 {
        margin: 0;
        font-size: 24px;
        }
        .content {
        padding: 20px;
        line-height: 1.6;
        text-align: center;
        }
        .content h2 {
        color: #ff7f50; /* Orange color */
        margin-bottom: 15px;
        }
        .content p {
        margin: 15px 0;
        }
        .cta-button {
        display: inline-block;
        background-color: #ff7f50; /* Orange color */
        color: #fff !important;
        text-decoration: none;
        padding: 10px 20px;
        border-radius: 5px;
        margin-top: 20px;
        font-size: 16px;
        }
        .cta-button:hover {
        background-color: #e5673d;
        }
        .footer {
        background-color: #f2f2f2;
        text-align: center;
        padding: 15px;
        font-size: 12px;
        color: #666;
        }
    </style>
    </head>
    <body>
    <div class="email-container">
        <div class="header">
        <h1>🍴 Welcome to Foodie's Paradise!</h1>
        </div>
        <div class="content">
        <h2>Explore Delicious Recipes</h2>
        <p>
            Thank you for signing up with <strong>Foodie's Paradise</strong>. We're thrilled to have you on board! 
            Start exploring mouthwatering recipes from around the world, tailored just for you.
        </p>
        <p>
            Need ingredients for your recipes? We've got you covered. Order fresh ingredients at the best prices directly from our app.
        </p>
        <a href="{{url}}" class="cta-button">Start Exploring Recipes</a>
        </div>
        <div class="footer">
        © 2024 Foodie's Paradise. All rights reserved.<br>
        If you didn't sign up for this account, please ignore this email.
        </div>
    </div>
    </body>
    </html>
`

export const loginVerificationEmailTemplete = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Two-Factor Authentication</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f9f9f9;
      color: #333;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background-color: #ff7f50; /* Orange color */
      color: #fff;
      text-align: center;
      padding: 20px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 20px;
      line-height: 1.6;
      text-align: center;
    }
    .content h2 {
      color: #ff7f50; /* Orange color */
      margin-bottom: 15px;
    }
    .content p {
      margin: 15px 0;
    }
    .verification-code {
      display: inline-block;
      font-size: 24px;
      font-weight: bold;
      color: #ff7f50;
      background-color: #f2f2f2;
      padding: 15px 30px;
      border-radius: 8px;
      margin-top: 20px;
    }
    .cta-button {
      display: inline-block;
      background-color: #ff7f50; /* Orange color */
      color: #fff !important;
      text-decoration: none;
      padding: 10px 20px;
      font-size: 16px;
      border-radius: 5px;
      margin-top: 20px;
    }
    .cta-button:hover {
      background-color: #e5673d;
    }
    .footer {
      background-color: #f2f2f2;
      text-align: center;
      padding: 15px;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>🔐 Two-Factor Authentication</h1>
    </div>
    <div class="content">
      <h2>Verify Your Identity</h2>
      <p>
        To complete your login, we need to verify your identity. Please use the following code to proceed:
      </p>
      
      <!-- Verification code block -->
      <div class="verification-code">
        {{code}}
      </div>

      <p>
        Enter this code in the app to successfully complete your login process. The code will expire in 10 minutes.
      </p>
      
      <a href="#" class="cta-button">Verify Now</a>
    </div>
    <div class="footer">
      © 2024 Foodie's Paradise. All rights reserved.<br>
      If you did not request this, please ignore this email.
    </div>
  </div>
</body>
</html>
`

export const forgetPasswordRequestEmailTemplete = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f9f9f9;
      color: #333;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background-color: #ff7f50; /* Orange color */
      color: #fff;
      text-align: center;
      padding: 20px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 20px;
      line-height: 1.6;
      text-align: center;
    }
    .content h2 {
      color: #ff7f50; /* Orange color */
      margin-bottom: 15px;
    }
    .content p {
      margin: 15px 0;
    }
    .cta-button {
      display: inline-block;
      background-color: #ff7f50; /* Orange color */
      color: #fff !important;
      text-decoration: none;
      padding: 10px 20px;
      font-size: 16px;
      border-radius: 5px;
      margin-top: 20px;
    }
    .cta-button:hover {
      background-color: #e5673d;
    }
    .footer {
      background-color: #f2f2f2;
      text-align: center;
      padding: 15px;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>🔑 Reset Your Password</h1>
    </div>
    <div class="content">
      <h2>Password Reset Request</h2>
      <p>
        We received a request to reset your password. If you didn't request a password reset, please ignore this email.
      </p>
      <p>
        To reset your password, please click the button below:
      </p>
      
      <!-- Reset password button -->
      <a href="{{reset_link}}" class="cta-button">Reset Password</a>

      <p>
        This link will expire in 30 minutes. If you didn't request a password reset, please contact support immediately.
      </p>
    </div>
    <div class="footer">
      © 2024 Foodie's Paradise. All rights reserved.<br>
      If you did not request this, please ignore this email.
    </div>
  </div>
</body>
</html>

`

export const resetPasswordSuccess = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Successful</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f9f9f9;
      color: #333;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background-color: #ff7f50; /* Orange color */
      color: #fff;
      text-align: center;
      padding: 20px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 20px;
      line-height: 1.6;
      text-align: center;
    }
    .content h2 {
      color: #ff7f50; /* Orange color */
      margin-bottom: 15px;
    }
    .content p {
      margin: 15px 0;
    }
    .cta-button {
      display: inline-block;
      background-color: #ff7f50; /* Orange color */
      color: #fff !important;
      text-decoration: none;
      padding: 10px 20px;
      font-size: 16px;
      border-radius: 5px;
      margin-top: 20px;
    }
    .cta-button:hover {
      background-color: #e5673d;
    }
    .footer {
      background-color: #f2f2f2;
      text-align: center;
      padding: 15px;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>🔑 Password Reset Successful</h1>
    </div>
    <div class="content">
      <h2>Your Password Has Been Reset</h2>
      <p>
        Congratulations! Your password has been successfully reset. You can now log in to your account using your new password.
      </p>
      <p>
        If you didn't request this change or if you encounter any issues, please contact support immediately.
      </p>

      <!-- Call-to-action button -->
      <a href="{{login_link}}" class="cta-button">Go to Login</a>
    </div>
    <div class="footer">
      © 2024 Foodie's Paradise. All rights reserved.<br>
      If you did not request this, please contact our support team.
    </div>
  </div>
</body>
</html>
`
export const dietPlanEmailTemplate = ({ goal, totalCalories, preferences, appLink = '' }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Personalized Diet Plan</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f9f9f9;
      color: #333;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background-color: #ff7f50;
      color: #fff;
      text-align: center;
      padding: 20px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 20px;
      line-height: 1.6;
      text-align: center;
    }
    .content h2 {
      color: #ff7f50;
      margin-bottom: 15px;
    }
    .content p {
      margin: 15px 0;
    }
    .content strong {
      color: #333;
    }
    .cta-button {
      display: inline-block;
      background-color: #ff7f50;
      color: #fff !important;
      text-decoration: none;
      padding: 10px 20px;
      font-size: 16px;
      border-radius: 5px;
      margin-top: 20px;
    }
    .cta-button:hover {
      background-color: #e5673d;
    }
    .footer {
      background-color: #f2f2f2;
      text-align: center;
      padding: 15px;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>🍽️ Your Personalized Diet Plan</h1>
    </div>
    <div class="content">
      <h2>Start Your Healthy Journey!</h2>
      <p>Thank you for using Reciplore! Attached is your personalized 30-day diet plan tailored to your goal: <strong>${goal}</strong>.</p>
      <p><strong>Total Daily Calories:</strong> ${totalCalories} kcal</p>
      <p><strong>Preferences:</strong> ${preferences}</p>
      <p>Enjoy your delicious and healthy meals!</p>
      <p>Best regards,<br>The Reciplore Team</p>
      <p>Need more recipes or want to adjust your plan? Visit our app to explore more!</p>
      <a href="${appLink}" class="cta-button">Explore More Recipes</a>
    </div>
    <div class="footer">
      © 2025 Reciplore. All rights reserved.<br>
      If you did not request this diet plan, please contact our support team.
    </div>
  </div>
</body>
</html>
`;