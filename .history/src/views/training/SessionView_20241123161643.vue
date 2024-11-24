<template>
  <div class="training-session">
    <!-- Header and status bar -->
    <header class="status-bar">
      <!-- ... (header content remains the same) ... -->
    </header>

    <!-- Main content area -->
    <main class="dashboard-grid">
      <!-- Heart rate monitoring card -->
      <div v-if="showHeartRate" class="dashboard-card primary-card">
        <!-- ... (heart rate card content remains the same) ... -->
      </div>

      <!-- Breathing guidance card -->
      <div v-if="showBreathing" class="dashboard-card">
        <!-- ... (breathing card content remains the same) ... -->
      </div>

      <!-- Training status card -->
      <div class="dashboard-car