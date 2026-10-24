@RegisterUser
Feature: User Registration in the Platform

    Scenario: Register the User
        Given HomePage: User navigate to Automation Exercise homepage
        Then HomePage: User validates the homepage title should contain "Automation Exercise"
        Then HomePage: User clicks on the "Signup / Login" link
        Then LoginSignup: User validates the text "New User Signup!" is visble
        Then LoginSignup: User enters "name01" in to "Name" field
        Then LoginSignup: User enters "name.01@gmail.com" in to "Email Address" field
        Then LoginSignup: User clicks on the "Signup" button
        Then Signup: User validates the text "Enter Account Information" is visble
        Then Signup: User selects the "Mr." radio button
        Then Signup: User enters "Password@01" into the input named "password"
        Then Signup: User selects "26" from the "days" dropdown
        And Signup: User selects "7" from the "months" dropdown
        And Signup: User selects "2004" from the "years" dropdown
        Then Signup: User checks the "Sign up for our newsletter!" checkbox
        Then Signup: User checks the "Receive special offers from our partners!" checkbox
        Then Signup: User enters "fname" into the input named "first_name"
        And Signup: User enters "lame" into the input named "last_name"
        And Signup: User enters "Example Company" into the input named "company"
        And Signup: User enters "123 Example Street" into the input named "address1"
        And Signup: User enters "Apartment 4" into the input named "address2"
        Then Signup: User selects "India" from the "country" dropdown
        Then Signup: User enters "Telangana" into the input named "state"
        And Signup: User enters "Hyderabad" into the input named "city"
        And Signup: User enters "500001" into the input named "zipcode"
        And Signup: User enters "9876543210" into the input named "mobile_number"
        Then Signup: User clicks the "Create Account" button
        Then AccountCreated: User validates the text "Account Created!" is visble
        Then AccountCreated: User clicks the "Continue" link
        Then HomePage: User verifies the logged in username is "name01"
        Then HomePage: User clicks on the "Delete Account" link
        Then AccountCreated: User validates the text "Account Deleted!" is visble
        Then AccountCreated: User clicks the "Continue" link