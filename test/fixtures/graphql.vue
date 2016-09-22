<template>
    <div>
        <span>Starwars Film: {{ film.title }}</span>
    </div>
</template>

<graphql>
{
    film(filmID: 1) {
        title
        director
    }
}
</graphql>

<script>
    export default {
        props: ['film'],
        data(graphql) {
            return graphql
                .success(function(data) {
                    return {
                        film: data.film
                    }
                })
                .error(function(errors) {
                    // Handle errors here
                })
        }
    }
</script>