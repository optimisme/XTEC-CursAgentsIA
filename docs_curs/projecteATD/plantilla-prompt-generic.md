# Objectiu

Necessito un prompt que em permeti definir l’**arnès**, la **planificació de tasques** i el **bucle agèntic d’implementació** d’aquest projecte.

El projecte consisteix en:

> ...

Les tecnologies, eines, restriccions i requeriments coneguts són:

> ...

El prompt resultant ha d’estar organitzat en aquests apartats:

## 1. Prompts del projecte

Genera tres prompts independents:

1. un per definir i crear l’**arnès del projecte**;
2. un per definir i crear les **tasques d’implementació**;
3. un per executar el **bucle agèntic d’implementació**.

Els dos primers prompts **no han d’implementar funcionalitats**. Només el tercer pot modificar el codi del projecte.

## 2. Requeriments i arquitectura

A partir de la descripció del projecte:

* resumeix els requeriments funcionals;
* defineix l’arquitectura tècnica adequada;
* defineix els components principals i les seves responsabilitats;
* defineix les integracions, interfícies o APIs necessàries;
* prioritza una arquitectura simple i fàcil de treballar amb poc context.

## 3. Eines i configuració

Defineix només les eines que siguin necessàries per aquest projecte.

Inclou, quan correspongui:

* eines de desenvolupament;
* eines de validació i tests;
* serveis externs;
* sistemes de seguiment de tasques;
* configuracions;
* variables d’entorn;
* secrets o credencials necessaris.

No imposis eines que no siguin necessàries.

## 4. Arnès

Defineix un arnès adequat al projecte i orientat a treballar amb agents petits i poc context.

Ha de definir:

* responsabilitats dels agents;
* skills necessàries;
* forma de seleccionar i executar tasques;
* validació independent;
* tests i prevenció de regressions;
* recuperació després d’interrupcions.

No implementis encara el projecte.

## 5. Model de tasques

Defineix **com han de ser les tasques**, però no generis encara totes les tasques concretes.

Cada tasca ha de tenir la informació necessària per poder-se implementar i validar de manera independent, com ara:

* objectiu;
* dependències;
* criteris d’acceptació;
* tests;
* prioritat;
* estat.

Adapta la representació de les tasques al sistema de seguiment més adequat per al projecte.

## 6. Generació de la planificació

El segon prompt haurà de convertir:

* requeriments;
* arquitectura;
* components;
* integracions;
* restriccions;
* tests;

en tasques petites, ordenades per dependències i prioritat, fins a cobrir tota la implementació del projecte.

La planificació ha de permetre desenvolupar el projecte progressivament i validar cada pas abans de continuar.

## 7. Bucle agèntic d’implementació

El tercer prompt ha de definir un bucle que:

1. determini la següent tasca executable;
2. implementi només aquella tasca;
3. executi els tests necessaris;
4. executi la regressió;
5. faci una revisió independent;
6. corregeixi els errors;
7. marqui la tasca com a completada;
8. continuï amb la següent.

Ha de poder reprendre correctament el treball després d’una interrupció.

# Criteris generals

Prioritza:

* simplicitat;
* tasques petites i autocontingudes;
* poc context;
* dependències explícites;
* criteris d’acceptació verificables;
* tests acumulatius;
* validació abans d’avançar;
* evitar treball fora de la tasca actual.

No imposis tecnologies, eines o sistemes de seguiment que no es derivin dels requeriments del projecte.
