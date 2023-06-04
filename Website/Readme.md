# Skeleton for the Snow Vision Website #

This folder contains our visualization of snow depths in the European
Alps.  We focus on the time period between 1964 and 2019.

To view the website, please run it locally by downloading this
directory and starting a web-server, for example, by running

``` python
python3 -m http.server
```

You will be greeted with a landing page that contains general
information about our visualization.  When you are ready, press the
*go to the visualization* button at the bottom of the page.  This
loads our interactive map.  Beware that this map displays *a lot* of
data.  Your browser will need to load roughly 100MB of data.

Once the data is fully loaded, you will be shown a quick guide on how
to proceed.  You may return to this guide at any point by pressing the
help button.  After studying the interactive map, you may click on a
station to see more information about it, or compare average monthly
snow depths at different stations by pressing the compare button and
selecting two stations on the map.

When you are done, you may press the finish button in the top-right
corner.

Each visualization has its own .js file in its own folder.  The
visualization.html file loads all these files and bundles the whole
project into one page.  This is necessary since re-loading the map
after returning from a station would take a long time and severely
impact the interactivity.

All our implementations are implemented using D3.js.  We use UIkit as
our CSS framework and we make use of icons from the FontAwesome icon
font.
