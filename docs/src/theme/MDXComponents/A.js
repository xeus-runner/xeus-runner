import Link from '@docusaurus/Link';

export default function MDXA(props) {
  return <Link {...props} target={props.target ?? '_self'} />;
}
