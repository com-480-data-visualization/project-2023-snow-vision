# Skeleton for the Snow Vision Website #

This folder contains a skeleton for our visualization about snow depth
in the European Alps.

The starting point is [`index.html`](index.html).  From here, the user
may get to the visualization in
[`visualization.html](visualization.html`).  By clicking on a station
in the visualization (currently realized by clicking on a button), the
user continues to [`station_view.html`](station_view.html).

Furthermore, we include a basic map showing station locations in
[`Map/map.html`](Map/map.html).  This map will serve as the foundation
for the Voronoi visualization.  We use a Voronoi chart to draw an area
around each station which will be colored according to the measured
snow depth in a selected month.  The folder [`Radial/`](Radial/)
contains two versions of a radial graph.  We may use these as a
foundation for creating our own radial graph showing the measured snow
depth at a selected station over time.  A preview of the website can
be found at
[https://com-480-data-visualization.github.io/project-2023-snow-vision/Website/](https://com-480-data-visualization.github.io/project-2023-snow-vision/Website/).
Please note that some of the files (in particular
[`Map/map.html`](Map/map.html) and the radial graphs) are not linked
from the website and must be accessed manually.
