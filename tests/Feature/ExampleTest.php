<?php

use Inertia\Testing\AssertableInertia as Assert;

test('home page renders the F3N-Bytes website', function () {
    $response = $this->get(route('home'));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('welcome')
            ->has('canRegister')
        );
});
