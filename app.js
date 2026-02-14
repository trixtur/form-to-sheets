const form = document.getElementById("signup-form");
const statusEl = document.getElementById("status");
const recaptchaContainer = document.getElementById("recaptcha");

const state = {
  config: null,
  recaptchaReady: false,
  recaptchaRendered: false
};

window.onRecaptchaLoad = () => {
  state.recaptchaReady = true;
  tryRenderRecaptcha();
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("Submitting...");

  if (!state.config) {
    setStatus("Configuration not loaded yet. Please try again.", "error");
    return;
  }

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
    await fetch(state.config.appsScriptUrl, {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify(payload)
    });

    form.reset();
    if (window.grecaptcha) {
      window.grecaptcha.reset();
    }
    setStatus("Submission sent for processing. A team member will review it soon.", "success");
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

async function loadConfig() {
  try {
    const response = await fetch("config.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Missing config.json");
    }
    const data = await response.json();
    if (!data.appsScriptUrl || !data.recaptchaSiteKey) {
      throw new Error("Invalid config.json");
    }
    state.config = data;
    tryRenderRecaptcha();
  } catch {
    setStatus("Configuration error. Check config.json.", "error");
  }
}

function tryRenderRecaptcha() {
  if (!state.config || !state.recaptchaReady || state.recaptchaRendered) {
    return;
  }
  if (!recaptchaContainer || !window.grecaptcha) {
    return;
  }
  window.grecaptcha.render(recaptchaContainer, {
    sitekey: state.config.recaptchaSiteKey
  });
  state.recaptchaRendered = true;
}

loadConfig();
