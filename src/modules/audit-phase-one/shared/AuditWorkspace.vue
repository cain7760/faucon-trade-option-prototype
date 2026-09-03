<template>
  <AuditWorkspaceRuntime :section="section" edition="phase1" />
</template>

<script setup lang="ts">
import AuditWorkspaceRuntime from '../../audit-shared/AuditWorkspace.vue'

defineProps<{
  section: 'dashboard' | 'issues' | 'operations'
}>()
</script>
