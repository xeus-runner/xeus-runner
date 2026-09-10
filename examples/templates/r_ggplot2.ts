// :title: ggplot2 plot

import { XeusKernel } from 'xeus-runner';

const kernel = new XeusKernel({
  type: 'r',
  packages: ['r-ggplot2'],
  parentElement: 'target',
  showCode: true,
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
