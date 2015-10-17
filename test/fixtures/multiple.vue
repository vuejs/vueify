<template lang="jade">
h1 Jade - node template engine
  #container.col
    a(href='http://vuejs.org') You are amazing
    p.
      Jade is a terse and simple
      templating language with a
      strong focus on performance
      and powerful features.
</template>

<style lang="stylus">
border-radius()
  -webkit-border-radius arguments
  -moz-border-radius arguments
  border-radius arguments

body
  font 12px Helvetica, Arial, sans-serif

a.button
  border-radius 5px
</style>

<script lang="coffee">
module.exports =
  data: ->
    a: 1
    b: 2
  events:
    'hook:created': ->
      console.log 'created!'
</script>