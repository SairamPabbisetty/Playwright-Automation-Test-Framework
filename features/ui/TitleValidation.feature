@SmokeTest
@HomePage
Feature: Homepage title validation

  Scenario: Verify the Automation Exercise homepage title
    Given HomePage: User navigate to Automation Exercise homepage
    Then HomePage: User validates the homepage title should contain "Automation Exercise"
