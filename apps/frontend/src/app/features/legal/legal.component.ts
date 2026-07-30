import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

type LegalDoc = 'privacidad' | 'terminos';

/**
 * Privacidad y Términos. Un solo componente para los dos documentos: la ruta
 * decide cuál mostrar vía `data.doc` (ver app.routes.ts).
 *
 * El contenido describe lo que el código realmente hace hoy: las tres cookies
 * que setea el backend (`auth`, `oauth_state`, `cmp_uid`), los datos que guarda
 * de una cuenta, y el hecho de que una comparación guardada es legible por
 * cualquiera que tenga el enlace. Si cambia alguna de esas conductas, este
 * texto tiene que cambiar con ellas.
 */
@Component({
  selector: 'app-legal',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-3xl px-4 py-10 md:px-8 md:py-16">
      <p class="stamp-label mb-3">
        N° legal · {{ doc() === 'privacidad' ? 'privacidad' : 'términos' }}
      </p>
      <h1 class="font-display text-3xl md:text-5xl text-ink leading-tight mb-6">
        {{ doc() === 'privacidad' ? 'Privacidad' : 'Términos de uso' }}
      </h1>
      <p class="font-mono text-[11px] uppercase tracking-stamp text-ink-muted mb-8">
        Última actualización: julio 2026
      </p>

      @if (doc() === 'privacidad') {
        <div class="legal-prose">
          <h2>Qué datos guardamos</h2>
          <p>
            Si no creas una cuenta, no guardamos ningún dato que te identifique.
            Las comparaciones que armas viven en el almacenamiento local de tu
            navegador y no salen de ahí hasta que decides guardarlas.
          </p>
          <p>Si creas una cuenta, guardamos:</p>
          <ul>
            <li>Tu nombre y tu correo electrónico.</li>
            <li>
              Tu contraseña, siempre cifrada con un hash. Nadie —tampoco
              nosotros— puede leerla.
            </li>
            <li>
              Si entras con Google o Apple, el identificador que ese proveedor
              nos entrega y el correo asociado. No recibimos tu contraseña.
            </li>
            <li>Los modelos que marcas como favoritos.</li>
            <li>Las comparaciones que guardas.</li>
          </ul>

          <h2>Cookies</h2>
          <p>Usamos tres cookies, todas propias. No hay cookies publicitarias.</p>
          <ul>
            <li>
              <code>auth</code> — mantiene tu sesión abierta. Se crea solo cuando
              inicias sesión y se borra cuando la cierras.
            </li>
            <li>
              <code>oauth_state</code> — protege el ingreso con Google o Apple
              contra suplantación. Dura lo que dura ese ingreso.
            </li>
            <li>
              <code>cmp_uid</code> — un identificador anónimo, sin relación con tu
              identidad, que sirve para no contar dos veces el mismo click al
              armar el ranking de modelos más comparados. Dura un año.
            </li>
          </ul>

          <h2>Comparaciones guardadas y enlaces compartibles</h2>
          <p>
            Cuando guardas una comparación, recibe un código corto y queda
            accesible en una dirección de la forma
            <code>/c/&lt;código&gt;</code>. Ese enlace es la función que te
            permite mandársela a alguien por WhatsApp:
            <strong>
              cualquier persona que tenga el enlace puede verla, sin iniciar
              sesión
            </strong>. No la publicamos en ninguna parte ni la indexamos en
            buscadores, y solo tú puedes verla en tu lista de comparaciones,
            renombrarla o eliminarla. Si no quieres que sea accesible, elimínala.
          </p>

          <h2>Terceros</h2>
          <p>
            No usamos herramientas de analítica ni de publicidad de terceros. El
            sitio carga sus tipografías desde Google Fonts, lo que implica que tu
            navegador hace una solicitud a los servidores de Google al abrir la
            página.
          </p>

          <h2>Tus datos</h2>
          <p>
            Puedes cambiar tu nombre y tu contraseña desde
            <a routerLink="/account/settings">Configuración</a>, y eliminar
            cuando quieras tus favoritos y tus comparaciones guardadas. Si
            quieres que borremos tu cuenta completa, escríbenos y lo hacemos.
          </p>
        </div>
      } @else {
        <div class="legal-prose">
          <h2>Para qué sirve este sitio</h2>
          <p>
            cualautocompro es una herramienta de consulta y comparación de autos
            nuevos del mercado chileno. No vendemos autos, no cotizamos, no
            intermediamos ninguna operación y no recibimos comisiones por
            derivarte a un concesionario.
          </p>

          <h2>Los datos son referenciales</h2>
          <p>
            Precios, equipamiento, especificaciones técnicas y costos estimados
            son de carácter <strong>informativo</strong> y pueden estar
            desactualizados o contener errores. Varían según versión, año,
            región y las condiciones comerciales de cada concesionario. No
            reemplazan la información oficial del fabricante.
            <strong>Confirma siempre en el concesionario antes de decidir.</strong>
          </p>
          <p>
            Lo mismo vale para el costo anual estimado: es un cálculo aproximado
            a partir de los datos publicados y de supuestos de uso. Sirve para
            comparar alternativas entre sí, no para presupuestar.
          </p>

          <h2>Tu cuenta</h2>
          <p>
            Eres responsable de la actividad de tu cuenta y de mantener tu
            contraseña a resguardo. Pedimos que no uses el sitio para extraer
            datos de forma automatizada ni para intentar degradar el servicio.
          </p>

          <h2>Contenido de terceros</h2>
          <p>
            Las marcas, logotipos y nombres de modelos pertenecen a sus
            respectivos titulares y se usan solo para identificar los vehículos
            comparados. Los enlaces a concesionarios llevan a sitios que no
            controlamos.
          </p>

          <h2>Cambios</h2>
          <p>
            Podemos ajustar estos términos a medida que el sitio evoluciona. La
            fecha de arriba indica la última actualización.
          </p>
        </div>
      }

      <hr class="hairline my-10" />
      <a
        routerLink="/catalogo"
        class="inline-flex items-center justify-center h-12 px-6 bg-ink text-paper font-semibold text-sm uppercase tracking-stamp hover:bg-engine transition-colors"
      >
        Ir al catálogo
      </a>
    </section>
  `,
  styles: [
    `
      .legal-prose h2 {
        font-family: var(--font-sans);
        font-weight: 600;
        font-size: 1.125rem;
        color: var(--ink);
        margin: 2rem 0 0.75rem;
      }
      .legal-prose h2:first-child {
        margin-top: 0;
      }
      .legal-prose p,
      .legal-prose li {
        color: var(--ink-muted);
        font-size: 0.9375rem;
        line-height: 1.7;
      }
      .legal-prose p {
        margin-bottom: 0.75rem;
      }
      .legal-prose ul {
        list-style: disc;
        padding-left: 1.25rem;
        margin-bottom: 0.75rem;
      }
      .legal-prose li {
        margin-bottom: 0.375rem;
      }
      .legal-prose strong {
        color: var(--ink);
        font-weight: 600;
      }
      .legal-prose code {
        font-family: var(--font-mono);
        font-size: 0.8125rem;
        background: var(--paper-warm);
        padding: 0.0625rem 0.25rem;
      }
      .legal-prose a {
        color: var(--engine);
        text-decoration: underline;
      }
    `,
  ],
})
export class LegalComponent {
  private route = inject(ActivatedRoute);
  private data = toSignal(this.route.data, {
    initialValue: this.route.snapshot.data,
  });

  readonly doc = computed<LegalDoc>(() =>
    this.data()['doc'] === 'terminos' ? 'terminos' : 'privacidad',
  );
}
