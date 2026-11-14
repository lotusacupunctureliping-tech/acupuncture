(function () {
  // Stripe Payment Link (or Checkout) URLs by voucher amount in AUD.
  // Leave a value empty until that link is created in Stripe.
  // For a custom amount, set customLink to a Payment Link that accepts
  // a variable amount, or replace getStripeCheckoutUrl with a backend
  // Checkout Session that can also pass buyer and recipient details.
  var STRIPE = {
    links: {
      50: "",
      100: "",
      150: "",
      200: ""
    },
    customLink: ""
  };

  var MIN_CUSTOM = 10;
  var MAX_CUSTOM = 1000;
  var PHONE_DISPLAY = "0423 031 003";
  var PHONE_TEL = "0423031003";

  var form = document.getElementById("voucher-form");
  var amountButtons = Array.prototype.slice.call(document.querySelectorAll(".voucher-amt"));
  var customWrap = document.getElementById("voucher-custom-wrap");
  var customInput = document.getElementById("voucher-custom-amount");
  var buyerName = document.getElementById("buyer-name");
  var buyerEmail = document.getElementById("buyer-email");
  var recipientName = document.getElementById("recipient-name");
  var recipientEmail = document.getElementById("recipient-email");
  var recipientEmailField = document.getElementById("recipient-email-field");
  var message = document.getElementById("voucher-message");
  var counter = document.getElementById("message-counter");
  var modeEmail = document.getElementById("mode-email");
  var modePrint = document.getElementById("mode-print");
  var deliveryMode = document.getElementById("delivery-mode");
  var scheduleBlock = document.getElementById("schedule-block");
  var scheduleToggle = document.getElementById("schedule-toggle");
  var scheduleNote = document.getElementById("schedule-note");
  var scheduleDateWrap = document.getElementById("schedule-date-wrap");
  var scheduleDate = document.getElementById("schedule-date");
  var printNote = document.getElementById("print-note");
  var buyBtn = document.getElementById("voucher-buy");
  var notice = document.getElementById("voucher-notice");

  var selectedKind = ""; // "preset" | "custom" | ""
  var selectedPreset = 0;

  function todayISO() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  scheduleDate.min = todayISO();

  function getAmount() {
    if (selectedKind === "preset") return selectedPreset;
    if (selectedKind === "custom") {
      var n = Number(customInput.value);
      if (Number.isFinite(n) && n >= MIN_CUSTOM && n <= MAX_CUSTOM) return Math.round(n);
    }
    return 0;
  }

  function formatAUD(n) {
    return "$" + n.toLocaleString("en-AU");
  }

  function setError(id, msg) {
    var el = document.getElementById(id);
    if (!el) return;
    if (msg) {
      el.textContent = msg;
      el.hidden = false;
    } else {
      el.textContent = "";
      el.hidden = true;
    }
  }

  function markInvalid(input, invalid) {
    if (!input) return;
    input.classList.toggle("invalid", !!invalid);
    if (invalid) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
  }

  function clearErrors() {
    ["err-amount", "err-buyer-name", "err-buyer-email", "err-recipient-name", "err-recipient-email", "err-schedule-date", "err-form"].forEach(function (id) {
      setError(id, "");
    });
    [customInput, buyerName, buyerEmail, recipientName, recipientEmail, scheduleDate].forEach(function (el) {
      markInvalid(el, false);
    });
  }

  function isEmailMode() {
    return deliveryMode.value === "email";
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function updateMode() {
    var email = isEmailMode();
    modeEmail.setAttribute("aria-pressed", email ? "true" : "false");
    modePrint.setAttribute("aria-pressed", email ? "false" : "true");
    recipientEmailField.hidden = !email;
    if (!email) {
      recipientEmail.value = "";
      markInvalid(recipientEmail, false);
      setError("err-recipient-email", "");
    }
    scheduleBlock.hidden = !email;
    printNote.hidden = email;
    if (!email) {
      scheduleToggle.checked = false;
      scheduleDate.value = "";
      updateSchedule();
    }
  }

  function updateSchedule() {
    var on = scheduleToggle.checked && isEmailMode();
    scheduleDateWrap.hidden = !on;
    scheduleNote.hidden = on;
    if (!on) {
      setError("err-schedule-date", "");
      markInvalid(scheduleDate, false);
    }
  }

  function updatePreview() {
    var amount = getAmount();
    var amountEl = document.getElementById("preview-amount");
    amountEl.textContent = amount ? formatAUD(amount) : "—";

    var to = recipientName.value.trim();
    document.getElementById("preview-to").textContent = to || "someone special";

    var from = buyerName.value.trim();
    document.getElementById("preview-from").textContent = from || "—";

    var msg = message.value.trim();
    var msgEl = document.getElementById("preview-msg");
    if (msg) {
      msgEl.hidden = false;
      msgEl.textContent = msg;
    } else {
      msgEl.hidden = true;
      msgEl.textContent = "";
    }

    counter.textContent = message.value.length + " / 500";

    if (amount) buyBtn.textContent = "Buy " + formatAUD(amount) + " gift voucher";
    else buyBtn.textContent = "Buy gift voucher";
  }

  function selectAmount(kind, value) {
    selectedKind = kind;
    selectedPreset = kind === "preset" ? value : 0;
    amountButtons.forEach(function (btn) {
      var isCustom = btn.getAttribute("data-amount") === "custom";
      var pressed = kind === "custom" ? isCustom : !isCustom && Number(btn.getAttribute("data-amount")) === value;
      btn.setAttribute("aria-pressed", pressed ? "true" : "false");
    });
    customWrap.hidden = kind !== "custom";
    if (kind !== "custom") {
      markInvalid(customInput, false);
      setError("err-amount", "");
    }
    updatePreview();
  }

  amountButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var raw = btn.getAttribute("data-amount");
      if (raw === "custom") {
        selectAmount("custom", 0);
        customInput.focus();
      } else {
        selectAmount("preset", Number(raw));
      }
    });
  });

  customInput.addEventListener("input", function () {
    if (selectedKind === "custom") {
      setError("err-amount", "");
      markInvalid(customInput, false);
      updatePreview();
    }
  });

  [buyerName, buyerEmail, recipientName, recipientEmail, message].forEach(function (el) {
    el.addEventListener("input", function () {
      markInvalid(el, false);
      if (el === buyerName) setError("err-buyer-name", "");
      if (el === buyerEmail) setError("err-buyer-email", "");
      if (el === recipientName) setError("err-recipient-name", "");
      if (el === recipientEmail) setError("err-recipient-email", "");
      updatePreview();
    });
  });

  modeEmail.addEventListener("click", function () {
    deliveryMode.value = "email";
    updateMode();
  });
  modePrint.addEventListener("click", function () {
    deliveryMode.value = "print";
    updateMode();
  });

  scheduleToggle.addEventListener("change", updateSchedule);
  scheduleDate.addEventListener("input", function () {
    setError("err-schedule-date", "");
    markInvalid(scheduleDate, false);
  });

  function getStripeCheckoutUrl(amount) {
    if (STRIPE.links[amount]) return STRIPE.links[amount];
    if (selectedKind === "custom" && STRIPE.customLink) return STRIPE.customLink;
    return "";
  }

  function collect() {
    return {
      amount: getAmount(),
      buyerName: buyerName.value.trim(),
      buyerEmail: buyerEmail.value.trim(),
      recipientName: recipientName.value.trim(),
      recipientEmail: recipientEmail.value.trim(),
      message: message.value.trim(),
      mode: deliveryMode.value,
      scheduled: isEmailMode() && scheduleToggle.checked,
      deliveryDate: scheduleDate.value
    };
  }

  function validate() {
    clearErrors();
    var data = collect();
    var first = null;

    if (selectedKind === "custom") {
      var n = Number(customInput.value);
      if (!customInput.value || !Number.isFinite(n)) {
        setError("err-amount", "Please enter a custom amount.");
        markInvalid(customInput, true);
        first = first || customInput;
      } else if (n < MIN_CUSTOM || n > MAX_CUSTOM) {
        setError("err-amount", "Please enter an amount between $" + MIN_CUSTOM + " and $" + MAX_CUSTOM + ".");
        markInvalid(customInput, true);
        first = first || customInput;
      }
    } else if (!data.amount) {
      setError("err-amount", "Please choose an amount.");
      first = first || amountButtons[0];
    }

    if (!data.buyerName) {
      setError("err-buyer-name", "Please enter your full name.");
      markInvalid(buyerName, true);
      first = first || buyerName;
    }
    if (!data.buyerEmail) {
      setError("err-buyer-email", "Please enter your email address.");
      markInvalid(buyerEmail, true);
      first = first || buyerEmail;
    } else if (!isValidEmail(data.buyerEmail)) {
      setError("err-buyer-email", "Please enter a valid email address.");
      markInvalid(buyerEmail, true);
      first = first || buyerEmail;
    }

    if (isEmailMode()) {
      if (!data.recipientName) {
        setError("err-recipient-name", "Please enter the recipient’s name.");
        markInvalid(recipientName, true);
        first = first || recipientName;
      }
      if (!data.recipientEmail) {
        setError("err-recipient-email", "Please enter the recipient’s email address.");
        markInvalid(recipientEmail, true);
        first = first || recipientEmail;
      } else if (!isValidEmail(data.recipientEmail)) {
        setError("err-recipient-email", "Please enter a valid email address.");
        markInvalid(recipientEmail, true);
        first = first || recipientEmail;
      }
      if (data.scheduled) {
        if (!data.deliveryDate) {
          setError("err-schedule-date", "Please choose a delivery date.");
          markInvalid(scheduleDate, true);
          first = first || scheduleDate;
        } else if (data.deliveryDate < todayISO()) {
          setError("err-schedule-date", "Please choose today or a later date.");
          markInvalid(scheduleDate, true);
          first = first || scheduleDate;
        }
      }
    }

    if (first) first.focus();
    return !first;
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (ch) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch];
    });
  }

  function formatDate(iso) {
    if (!iso) return "";
    var parts = iso.split("-");
    if (parts.length !== 3) return iso;
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
  }

  function showPhonePlaceholder(data) {
    var rows = [];
    rows.push("<li><strong>Amount:</strong> " + escapeHtml(formatAUD(data.amount)) + "</li>");
    rows.push("<li><strong>From:</strong> " + escapeHtml(data.buyerName) + " (" + escapeHtml(data.buyerEmail) + ")</li>");
    if (data.recipientName) rows.push("<li><strong>To:</strong> " + escapeHtml(data.recipientName) + (data.recipientEmail ? " (" + escapeHtml(data.recipientEmail) + ")" : "") + "</li>");
    rows.push("<li><strong>Delivery:</strong> " + (data.mode === "print" ? "Print at home" : data.scheduled ? "Email on " + escapeHtml(formatDate(data.deliveryDate)) : "Email right after purchase") + "</li>");
    if (data.message) rows.push("<li><strong>Message:</strong> " + escapeHtml(data.message) + "</li>");

    notice.hidden = false;
    notice.innerHTML =
      "<p>Thank you. Online payment isn’t available on the website just yet.</p>" +
      "<p>To buy this " + escapeHtml(formatAUD(data.amount)) + " voucher now, please text <a href=\"sms:" + PHONE_TEL + "\">" + PHONE_DISPLAY + "</a>. I’ll arrange it for you with these details:</p>" +
      "<ul>" + rows.join("") + "</ul>";
    notice.focus();
    notice.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    notice.hidden = true;
    notice.innerHTML = "";
    if (!validate()) {
      setError("err-form", "Please check the highlighted fields and try again.");
      return;
    }
    var data = collect();
    var url = getStripeCheckoutUrl(data.amount);
    if (url) {
      window.location.href = url;
      return;
    }
    showPhonePlaceholder(data);
  });

  notice.setAttribute("tabindex", "-1");
  updateMode();
  updateSchedule();
  updatePreview();
})();
