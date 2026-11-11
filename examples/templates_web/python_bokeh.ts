// :title: Bokeh interactive plot

import { DOMMessageHandler, XeusKernel } from 'xeus-runner';

const kernel = new XeusKernel({
  type: 'python',
  packages: ['bokeh'],
  messageHandler: new DOMMessageHandler({ targetElement: 'target' }),
  // :worker:
});

await kernel.execute({
  code: `from bokeh.io import output_notebook
output_notebook()`,
});

// Wait for BokehJS and all of its plugins to finish loading.
while ((window as any)._bokeh_is_loading !== 0) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

const code = `from bokeh.layouts import layout
from bokeh.models import Div, RangeSlider, Spinner
from bokeh.plotting import figure, show

x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
y = [4, 5, 5, 7, 2, 6, 4, 9, 1, 3]

p = figure(x_range=(1, 9), height=250, sizing_mode="stretch_width")
points = p.scatter(x=x, y=y, size=30, fill_color="#21a7df")

div = Div(text="<p>Select the circle's size using this control element:</p>", width=200, height=30)

spinner = Spinner(title="Circle size", low=0, high=60, step=5, value=points.glyph.size, width=200)
spinner.js_link("value", points.glyph, "size")

range_slider = RangeSlider(title="Adjust x-axis range", start=0, end=10, step=1, value=(p.x_range.start, p.x_range.end))
range_slider.js_link("value", p.x_range, "start", attr_selector=0)
range_slider.js_link("value", p.x_range, "end", attr_selector=1)

layout = layout([[div, spinner], [range_slider], [p]], sizing_mode="stretch_width")
show(layout)
`;
kernel.execute({ code });
