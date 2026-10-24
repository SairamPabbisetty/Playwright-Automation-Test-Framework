@RegisterUser
@temp
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