<template>
  <div class="home-page">
    <NewPixiMap
      :mapObj="mapObj"
      :local="true"
      NowTabID="pixi-map-container"
    />
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import NewPixiMap from '@/components/newpixiMap/index.vue'

const mapObj = reactive({
  MapHeight: 600,
  MapWidth: 800,
  backgroundColor: 0xf0f0f0,
  OffsetY: 0,
  OffsetX: 0,
})
</script>

<style scoped>
.home-page {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
