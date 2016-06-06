<template lang="marko">
macro greeting(name,color)
  div class="greeting" style="background-color: ${color}"
    - Hello ${name}!
greeting name="World" color="green"
greeting('Frank', 'yellow')
</template>
