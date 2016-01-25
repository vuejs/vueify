<style scoped>
  div { color: red; }
  .test { color: green; }
  .test:after { content: 'bye!'; }
  @media print { div { color:green; } }
</style>

<template>
  <div>hi<p class="test">bye</p></div>
  <template v-if="ok"><p class="test">yo</p></template>
  <svg><template><p></p></template></svg>
</template>
