const CONFIG = {
  appsScriptUrl: "APPS_SCRIPT_WEB_APP_URL",
  recaptchaSiteKey: "RECAPTCHA_SITE_KEY"
};

const form = document.getElementById("signup-form");
const statusEl = document.getElementById("status");

const recaptchaContainer = document.querySelector(".g-recaptcha");
if (recaptchaContainer) {
  recaptchaContainer.setAttribute("data-sitekey", CONFIG.recaptchaSiteKey);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("Submitting...");

  const token = window.grecaptcha ? window.grecaptcha.getResponse() : "";
  if (!token) {
    setStatus("Please complete the reCAPTCHA.", "error");
    return;
  }

  const payload = {
    firstName: form.firstName.value.trim(),
    lastName: form.lastName.value.trim(),
    email: form.email.value.trim(),
    streetAddress: form.streetAddress.value.trim(),
    callsign: form.callsign.value.trim(),
    recaptchaToken: token
  };

  try {
    const response = await fetch(CONFIG.appsScriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || "Submission failed.");
    }

    form.reset();
    if (window.grecaptcha) {
      window.grecaptcha.reset();
    }
    setStatus("Submission received. A team member will review it soon.", "success");
  } catch (err) {
    setStatus(err.message || "Something went wrong.", "error");
  }
});

function setStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = "status";
  if (type) {
    statusEl.classList.add(type);
  }
}
