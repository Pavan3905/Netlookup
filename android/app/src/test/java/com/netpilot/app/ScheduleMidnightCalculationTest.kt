package com.netpilot.app

import com.netpilot.app.core.model.DayOfWeek
import com.netpilot.app.core.model.ScheduleAction
import com.netpilot.app.core.model.ScheduledPolicy
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.DayOfWeek as JvmDayOfWeek
import java.time.LocalTime

class ScheduleMidnightCalculationTest {

    @Test
    fun testStandardDayWindowInside() {
        val schedule = ScheduledPolicy(
            id = "test-1",
            targetDeviceId = "dev-1",
            targetMacOrIp = "192.168.1.50",
            action = ScheduleAction.PAUSE_INTERNET,
            startTime = LocalTime.of(14, 0), // 2:00 PM
            endTime = LocalTime.of(18, 0),   // 6:00 PM
            activeDays = setOf(JvmDayOfWeek.MONDAY, JvmDayOfWeek.TUESDAY)
        )

        assertFalse("Schedule should not cross midnight", schedule.crossesMidnight)
        assertTrue("3:00 PM should be inside window", schedule.isTimeInsideWindow(LocalTime.of(15, 0)))
        assertFalse("1:59 PM should be outside window", schedule.isTimeInsideWindow(LocalTime.of(13, 59)))
        assertFalse("6:01 PM should be outside window", schedule.isTimeInsideWindow(LocalTime.of(18, 1)))
    }

    @Test
    fun testMidnightCrossingWindow() {
        val schedule = ScheduledPolicy(
            id = "test-2",
            targetDeviceId = "dev-2",
            targetMacOrIp = "192.168.1.60",
            action = ScheduleAction.PAUSE_INTERNET,
            startTime = LocalTime.of(22, 0), // 10:00 PM
            endTime = LocalTime.of(6, 0),    // 6:00 AM next day
            activeDays = setOf(JvmDayOfWeek.FRIDAY)
        )

        assertTrue("Schedule MUST detect midnight crossing", schedule.crossesMidnight)
        assertTrue("11:30 PM should be inside window", schedule.isTimeInsideWindow(LocalTime.of(23, 30)))
        assertTrue("2:00 AM should be inside window", schedule.isTimeInsideWindow(LocalTime.of(2, 0)))
        assertTrue("5:59 AM should be inside window", schedule.isTimeInsideWindow(LocalTime.of(5, 59)))
        assertFalse("7:00 AM should be outside window", schedule.isTimeInsideWindow(LocalTime.of(7, 0)))
        assertFalse("9:00 PM should be outside window", schedule.isTimeInsideWindow(LocalTime.of(21, 0)))
    }
}
