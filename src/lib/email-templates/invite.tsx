import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import {
  FONT_STYLESHEET,
  button,
  container,
  content,
  footer,
  h1,
  header,
  headerText,
  link,
  main,
  text,
} from './brand'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head>
      <link rel="stylesheet" href={FONT_STYLESHEET} />
    </Head>
    <Preview>You've been invited to join {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={headerText}>{siteName}</Text>
        </Section>
        <Section style={content}>
          <Heading style={h1}>You've been invited</Heading>
          <Text style={text}>
            You've been invited to join{' '}
            <Link href={siteUrl} style={link}>
              <strong>{siteName}</strong>
            </Link>
            . Click the button below to accept the invitation and create your
            account.
          </Text>
          <Button style={button} href={confirmationUrl}>
            Accept Invitation
          </Button>
          <Text style={footer}>
            If you weren't expecting this invitation, you can safely ignore
            this email.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail
