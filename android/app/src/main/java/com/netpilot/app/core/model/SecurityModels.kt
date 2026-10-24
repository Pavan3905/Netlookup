package com.netpilot.app.core.model

data class SecurityFinding(
    val id: String,
    val title: String,
    val description: String,
    val severity: Severity,
    val category: AuditCategory,
    val target: String,
    val recommendation: String,
    val detectedAtTimestamp: Long = System.currentTimeMillis()
)

enum class Severity {
    CRITICAL,
    HIGH,
    MEDIUM,
    LOW,
    INFO
}

enum class AuditCategory {
    UNENCRYPTED_SERVICES,
    EXPOSED_ADMIN_PANEL,
    DEFAULT_CREDENTIAL_RISK,
    DNS_LEAK,
    EXPIRED_OR_WEAK_TLS,
    WEAK_ROUTER_ENCRYPTION,
    UNRECOGNIZED_NEW_DEVICE
}

data class DiagnosticResult(
    val tool: String,
    val target: String,
    val isSuccess: Boolean,
    val latencyMs: Long? = null,
    val details: Map<String, String> = emptyMap(),
    val error: String? = null,
    val timestamp: Long = System.currentTimeMillis()
)
