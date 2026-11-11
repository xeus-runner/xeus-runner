// :title: ggplot2 plot

import { DOMMessageHandler, XeusKernel } from '@xeus-runner/xeus-runner';

const kernel = new XeusKernel({
  type: 'r',
  packages: ['r-ggplot2'],
  messageHandler: new DOMMessageHandler({ targetElement: 'target' }),
  // :worker:
});
const code = `library(ggplot2)

data <- data.frame(
  x = 1:10,
  y = (1:10)^2
)

ggplot(data, aes(x = x, y = y)) +
  geom_point(color = "blue", size = 3) +
  labs(title = "Example ggplot2 plot") +
  theme_minimal()`;
kernel.execute({ code });
