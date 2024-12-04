export const verificationEmailTemplate=`
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