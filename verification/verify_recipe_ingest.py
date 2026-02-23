from playwright.sync_api import Page, expect, sync_playwright

def test_recipe_ingest(page: Page):
    # Navigate to home
    page.goto("http://localhost:3000")

    # Wait for the RecipeIngest component to load
    input_field = page.get_by_placeholder("Enter recipe URL")
    expect(input_field).to_be_visible()

    # Check attributes
    expect(input_field).to_have_attribute("type", "url")
    # Check for required attribute. The value might be empty string or "required" depending on browser/framework.
    # We can just check if get_attribute returns not None.
    assert input_field.get_attribute("required") is not None, "Input should have required attribute"

    expect(input_field).to_have_attribute("aria-label", "Recipe URL")

    # Check button
    button = page.get_by_role("button", name="Smart Ingest Recipe")
    expect(button).to_be_visible()
    expect(button).to_have_attribute("type", "submit")

    # Take screenshot
    page.screenshot(path="verification/recipe_ingest.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_recipe_ingest(page)
            print("Verification successful!")
        except Exception as e:
            print(f"Verification failed: {e}")
            exit(1)
        finally:
            browser.close()
