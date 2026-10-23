<?php

use Inertia\Testing\AssertableInertia as Assert;

test('map editor page renders', function () {
    $response = $this->get(route('map.editor'));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('map-editor'));
});
