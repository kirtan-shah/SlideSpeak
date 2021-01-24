from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException

driver = webdriver.Chrome()
driver.get("https://quillbot.com/summarize")
#assert "Python" in driver.title
try:
    myElem = WebDriverWait(driver, 3).until(EC.presence_of_element_located((By.CSS_SELECTOR, '.MuiToggleButtonGroup-root button:first-child')))
    print ("Page is ready!")
except TimeoutException:
    print ("Loading took too much time!")
driver.find_element_by_css_selector(".MuiToggleButtonGroup-root button:first-child").click()
elem = driver.find_element_by_id("inputBoxSummarizer")
elem.clear()
elem.send_keys("Slide Speak has many uses in the real world. Teachers can use it for building lectures. Students can use it for creating presentations. Business leaders can use it since presentations are a frequent pain to make.")
btn = driver.find_element_by_class_name("QuillButton-sc-12j9igu-0")
btn.click()
#elem.send_keys(Keys.RETURN)
assert "No results found." not in driver.page_source
driver.close()