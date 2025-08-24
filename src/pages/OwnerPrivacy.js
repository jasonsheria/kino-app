import React, { useRef } from 'react';
import OwnerLayout from '../components/owner/OwnerLayout';
import '../styles/owner.css';
import { Container, Grid, Paper, Typography, Button, List, ListItem, ListItemButton, ListItemText, Divider, Accordion, AccordionSummary, AccordionDetails, useTheme, useMediaQuery, IconButton, Stack } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PrintIcon from '@mui/icons-material/Print';
import GetAppIcon from '@mui/icons-material/GetApp';

const SECTIONS = [
  { id: 'collecte', title: 'Collecte des données', body: `Nous recueillons des informations que vous fournissez directement (profil, biens, messages), des informations de navigation (cookies, logs), et des informations provenant de tiers lorsque vous connectez des services externes.` },
  { id: 'usage', title: 'Usage des données', body: `Les données sont utilisées pour fournir et améliorer nos services, traiter les demandes de visite, communiquer avec les clients, prévenir la fraude et se conformer aux obligations légales.` },
  { id: 'partage', title: 'Partage & tiers', body: `Nous pouvons partager des données avec des prestataires (hébergement, analytics), des partenaires (agences, agents) et lorsque la loi l'exige. Nous n'avons pas pour habitude de vendre vos données.` },
  { id: 'cookies', title: 'Cookies & trackers', body: `Nous utilisons des cookies techniques et analytiques pour améliorer l'expérience. Vous pouvez gérer vos préférences via le navigateur et nos paramètres de compte.` },
  { id: 'conservation', title: 'Conservation des données', body: `Les données sont conservées le temps nécessaire pour la finalité pour laquelle elles ont été recueillies, sauf obligation légale contraire. Vous pouvez demander la suppression de votre compte.` },
  { id: 'droits', title: 'Vos droits', body: `Vous pouvez demander l'accès, la rectification, l'effacement, la limitation du traitement et la portabilité de vos données. Pour exercer vos droits, contactez-nous via l'onglet Contact ci-dessous.` },
  { id: 'contact', title: 'Contact', body: `Pour toute question liée à la vie privée:\nEmail: privacy@ndaku.example\nAdresse: 1 rue Exemple, 75000 Paris` }
];

function Section({ id, title, children }){
  return (
    <section id={id} className="privacy-section">
      <Typography variant="h6" style={{marginBottom:8}}>{title}</Typography>
      <Typography variant="body2" className="muted-small">{children}</Typography>
    </section>
  );
}

export default function OwnerPrivacy(){
  const containerRef = useRef();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));

  const onPrint = ()=> window.print();
  const downloadPDF = ()=> onPrint();

  return (
    <OwnerLayout>
      <Container maxWidth="lg" style={{paddingTop:20, paddingBottom:40}}>
        <Grid container spacing={2} alignItems="flex-start">
          <Grid item xs={12}>
            <div className="d-flex align-items-start justify-content-between mb-3">
              <div>
                <Typography variant="h5" style={{fontWeight:800}}>Politique de confidentialité</Typography>
                <Typography variant="body2" color="textSecondary">Comment nous recueillons, utilisons et protégeons les données des utilisateurs.</Typography>
              </div>
              <Stack
                direction={isSmall ? 'column' : 'row'}
                spacing={1}
                className="privacy-header-actions"
                sx={{ alignItems: isSmall ? 'stretch' : 'center' }}
              >
                <Button variant="outlined" startIcon={<PrintIcon />} onClick={onPrint} fullWidth={isSmall}>Imprimer</Button>
                <Button variant="outlined" startIcon={<GetAppIcon />} onClick={downloadPDF} fullWidth={isSmall}>Télécharger</Button>
              </Stack>
            </div>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper variant="outlined" className="privacy-toc">
              <Typography variant="subtitle2" className="muted-small" style={{marginBottom:8}}>Sommaire</Typography>
              {!isSmall ? (
                <List dense>
                  {SECTIONS.map(s => (
                    <ListItem key={s.id} disablePadding>
                      <ListItemButton component="a" href={`#${s.id}`}>
                        <ListItemText primary={s.title} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <div>
                  {SECTIONS.map(s => (
                    <Accordion key={s.id} elevation={0} disableGutters>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="body2" style={{fontWeight:700}}>{s.title}</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="body2" className="muted-small">{s.body}</Typography>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </div>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper variant="outlined" className="privacy-content" ref={containerRef} style={{padding:18}}>
              {SECTIONS.map(s => (
                <Section key={s.id} id={s.id} title={s.title}>{s.body.split('\n').map((line, i) => <span key={i}>{line}<br/></span>)}</Section>
              ))}

              <Divider style={{marginTop:12, marginBottom:12}} />
              <Typography variant="body2" color="textSecondary">Dernière mise à jour: 17 août 2025</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </OwnerLayout>
  );
}
