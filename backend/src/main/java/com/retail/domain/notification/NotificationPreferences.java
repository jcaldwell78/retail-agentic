package com.retail.domain.notification;

import java.time.Instant;

/**
 * User notification preferences.
 * Controls which notification channels are enabled for different notification types.
 */
public class NotificationPreferences {

    // Email notifications (default: enabled)
    private boolean emailOrderUpdates = true;
    private boolean emailMarketing = false;
    private boolean emailCartReminders = true;
    private boolean emailPriceDrops = true;
    private boolean emailStockAlerts = true;

    // SMS notifications (default: disabled, requires opt-in)
    private boolean smsOrderUpdates = false;
    private boolean smsMarketing = false;
    private boolean smsCartReminders = false;
    private boolean smsPriceDrops = false;
    private boolean smsStockAlerts = false;

    // Push notifications (default: disabled)
    private boolean pushOrderUpdates = false;
    private boolean pushMarketing = false;
    private boolean pushCartReminders = false;
    private boolean pushPriceDrops = false;
    private boolean pushStockAlerts = false;

    // SMS consent tracking for TCPA/GDPR compliance
    private boolean smsConsentGiven = false;
    private Instant smsConsentTimestamp;
    private String smsConsentSource; // "checkout", "account-settings", "popup", etc.

    // Constructors
    public NotificationPreferences() {
    }

    // Factory method for default preferences
    public static NotificationPreferences defaultPreferences() {
        return new NotificationPreferences();
    }

    // Getters and Setters - Email
    public boolean isEmailOrderUpdates() {
        return emailOrderUpdates;
    }

    public void setEmailOrderUpdates(boolean emailOrderUpdates) {
        this.emailOrderUpdates = emailOrderUpdates;
    }

    public boolean isEmailMarketing() {
        return emailMarketing;
    }

    public void setEmailMarketing(boolean emailMarketing) {
        this.emailMarketing = emailMarketing;
    }

    public boolean isEmailCartReminders() {
        return emailCartReminders;
    }

    public void setEmailCartReminders(boolean emailCartReminders) {
        this.emailCartReminders = emailCartReminders;
    }

    public boolean isEmailPriceDrops() {
        return emailPriceDrops;
    }

    public void setEmailPriceDrops(boolean emailPriceDrops) {
        this.emailPriceDrops = emailPriceDrops;
    }

    public boolean isEmailStockAlerts() {
        return emailStockAlerts;
    }

    public void setEmailStockAlerts(boolean emailStockAlerts) {
        this.emailStockAlerts = emailStockAlerts;
    }

    // Getters and Setters - SMS
    public boolean isSmsOrderUpdates() {
        return smsOrderUpdates;
    }

    public void setSmsOrderUpdates(boolean smsOrderUpdates) {
        this.smsOrderUpdates = smsOrderUpdates;
    }

    public boolean isSmsMarketing() {
        return smsMarketing;
    }

    public void setSmsMarketing(boolean smsMarketing) {
        this.smsMarketing = smsMarketing;
    }

    public boolean isSmsCartReminders() {
        return smsCartReminders;
    }

    public void setSmsCartReminders(boolean smsCartReminders) {
        this.smsCartReminders = smsCartReminders;
    }

    public boolean isSmsPriceDrops() {
        return smsPriceDrops;
    }

    public void setSmsPriceDrops(boolean smsPriceDrops) {
        this.smsPriceDrops = smsPriceDrops;
    }

    public boolean isSmsStockAlerts() {
        return smsStockAlerts;
    }

    public void setSmsStockAlerts(boolean smsStockAlerts) {
        this.smsStockAlerts = smsStockAlerts;
    }

    // Getters and Setters - Push
    public boolean isPushOrderUpdates() {
        return pushOrderUpdates;
    }

    public void setPushOrderUpdates(boolean pushOrderUpdates) {
        this.pushOrderUpdates = pushOrderUpdates;
    }

    public boolean isPushMarketing() {
        return pushMarketing;
    }

    public void setPushMarketing(boolean pushMarketing) {
        this.pushMarketing = pushMarketing;
    }

    public boolean isPushCartReminders() {
        return pushCartReminders;
    }

    public void setPushCartReminders(boolean pushCartReminders) {
        this.pushCartReminders = pushCartReminders;
    }

    public boolean isPushPriceDrops() {
        return pushPriceDrops;
    }

    public void setPushPriceDrops(boolean pushPriceDrops) {
        this.pushPriceDrops = pushPriceDrops;
    }

    public boolean isPushStockAlerts() {
        return pushStockAlerts;
    }

    public void setPushStockAlerts(boolean pushStockAlerts) {
        this.pushStockAlerts = pushStockAlerts;
    }

    // SMS Consent
    public boolean isSmsConsentGiven() {
        return smsConsentGiven;
    }

    public void setSmsConsentGiven(boolean smsConsentGiven) {
        this.smsConsentGiven = smsConsentGiven;
    }

    public Instant getSmsConsentTimestamp() {
        return smsConsentTimestamp;
    }

    public void setSmsConsentTimestamp(Instant smsConsentTimestamp) {
        this.smsConsentTimestamp = smsConsentTimestamp;
    }

    public String getSmsConsentSource() {
        return smsConsentSource;
    }

    public void setSmsConsentSource(String smsConsentSource) {
        this.smsConsentSource = smsConsentSource;
    }

    /**
     * Record SMS consent with TCPA/GDPR compliance.
     */
    public void recordSmsConsent(String source) {
        this.smsConsentGiven = true;
        this.smsConsentTimestamp = Instant.now();
        this.smsConsentSource = source;
    }

    /**
     * Revoke SMS consent.
     */
    public void revokeSmsConsent() {
        this.smsConsentGiven = false;
        this.smsOrderUpdates = false;
        this.smsMarketing = false;
        this.smsCartReminders = false;
        this.smsPriceDrops = false;
        this.smsStockAlerts = false;
    }

    /**
     * Check if any SMS notifications are enabled.
     */
    public boolean hasAnySmsEnabled() {
        return smsOrderUpdates || smsMarketing || smsCartReminders ||
               smsPriceDrops || smsStockAlerts;
    }

    /**
     * Enable SMS cart reminders with consent.
     */
    public void enableSmsCartReminders(String consentSource) {
        if (!smsConsentGiven) {
            recordSmsConsent(consentSource);
        }
        this.smsCartReminders = true;
    }
}
