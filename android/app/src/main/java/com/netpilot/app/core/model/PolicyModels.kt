package com.netpilot.app.core.model

import java.time.DayOfWeek
import java.time.LocalTime
import java.time.ZoneId

/**
 * Access policy schedule configured by user.
 * Supports midnight crossings (e.g. 22:00 to 06:00), weekday masks, and timezone persistence.
 */
data class ScheduledPolicy(
    val id: String,
    val targetDeviceId: String,
    val targetMacOrIp: String,
    val action: ScheduleAction,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val activeDays: Set<DayOfWeek>,
    val timeZone: ZoneId = ZoneId.systemDefault(),
    val isEnabled: Boolean = true,
    val priority: Int = 10,
    val lastExecutedTimestamp: Long? = null,
    val nextExecutionTimestamp: Long? = null,
    val lastExecutionStatus: ExecutionStatus = ExecutionStatus.IDLE
) {
    /**
     * Returns true if this schedule spans across midnight (e.g. 22:00 to 06:00).
     */
    val crossesMidnight: Boolean
        get() = endTime.isBefore(startTime)

    /**
     * Checks if a given time falls within the window, taking midnight crossing into account.
     */
    fun isTimeInsideWindow(time: LocalTime): Boolean {
        return if (crossesMidnight) {
            !time.isBefore(startTime) || time.isBefore(endTime)
        } else {
            !time.isBefore(startTime) && time.isBefore(endTime)
        }
    }
}

enum class ScheduleAction {
    PAUSE_INTERNET,
    BLOCK_ALL_TRAFFIC,
    ENFORCE_FAMILY_DNS
}

enum class ExecutionStatus {
    IDLE,
    APPLYING,
    APPLIED_VERIFIED,
    RESTORED_VERIFIED,
    FAILED_RETRYING,
    UNSUPPORTED_ON_ROUTER
}

data class FilterProfile(
    val id: String,
    val name: String,
    val description: String,
    val isGlobalDefault: Boolean = false,
    val enabledCategories: Set<FilterCategory> = emptySet(),
    val customBlockedDomains: List<String> = emptyList(),
    val customAllowedDomains: List<String> = emptyList()
)

enum class FilterCategory {
    MALWARE_AND_PHISHING,
    ADULT_CONTENT,
    GAMBLING,
    TRACKING_AND_TELEMETRY,
    SOCIAL_MEDIA
}

data class DomainRule(
    val domain: String,
    val isAllowed: Boolean,
    val addedTimestamp: Long = System.currentTimeMillis(),
    val notes: String? = null
)
