<?php

use Inertia\Testing\AssertableInertia as Assert;

test('projects page renders all projects archive', function () {
    $response = $this->get(route('projects'));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('projects')
        );
});
