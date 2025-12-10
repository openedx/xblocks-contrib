/**
 * Configure jasmine-jquery to find your HTML fixtures.
 *
 * This tells jasmine-jquery to look for fixtures relative to the `/base/js/`
 * directory that Karma serves.
 *
 * For example, a call to `loadFixtures('fixtures/problem.html')` will correctly
 * fetch the file from `js/fixtures/problem.html`.
 */
jasmine.getFixtures().fixturesPath = '/base/js/fixtures';