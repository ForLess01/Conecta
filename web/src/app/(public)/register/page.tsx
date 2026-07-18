"use client";

import { useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { img } from "@/lib/images";
import { createClient } from "@/lib/supabase/client";

type FieldName = "firstName" | "lastName" | "phone" | "email" | "password" | "passwordConfirmation" | "terms";
type RegisterErrors = Partial<Record<FieldName, string>>;

const registerSchema = z
  .object({
    firstName: z.string().trim().min(2, "Ingresa tus nombres."),
    lastName: z.string().trim().min(2, "Ingresa tus apellidos."),
    phone: z
      .string()
      .transform((value) => value.replace(/[\s()+-]/g, ""))
      .refine((value) => /^(?:51)?9\d{8}$/.test(value), "Usa un celular peruano de 9 dígitos."),
    email: z.email("Ingresa un correo válido."),
    password: z.string().min(8, "Usa al menos 8 caracteres."),
    passwordConfirmation: z.string(),
    terms: z.boolean().refine(Boolean, "Debes aceptar los términos para continuar."),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Las contraseñas no coinciden.",
    path: ["passwordConfirmation"],
  });

const STEPS = [
  { title: "Crea tu acceso", description: "Completa tus datos personales y de contacto." },
  { title: "Elige cómo participar", description: "Selecciona uno o varios roles de trabajo." },
  { title: "Completa tu perfil", description: "Agrega la información necesaria para operar." },
];

export default function RegisterPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = registerSchema.safeParse({
      firstName: String(form.get("firstName") ?? ""),
      lastName: String(form.get("lastName") ?? ""),
      phone: String(form.get("phone") ?? ""),
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
      passwordConfirmation: String(form.get("passwordConfirmation") ?? ""),
      terms: acceptedTerms,
    });
    const nextErrors: RegisterErrors = result.success
      ? {}
      : Object.fromEntries(
          Object.entries(result.error.flatten().fieldErrors).map(([field, messages]) => [field, messages?.[0]])
        );

    setErrors(nextErrors);
    const firstError = Object.keys(nextErrors)[0] as FieldName | undefined;
    if (firstError) {
      const target = formRef.current?.elements.namedItem(firstError);
      if (target instanceof HTMLElement) target.focus();
      return;
    }

    if (!result.success) return;

    setIsSubmitting(true);
    const { data, error } = await createClient().auth.signUp({
      email: result.data.email,
      password: result.data.password,
      options: {
        data: {
          full_name: `${result.data.firstName} ${result.data.lastName}`,
          phone: result.data.phone,
        },
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=/role-selection`,
      },
    });
    setIsSubmitting(false);

    if (error) {
      setErrors({ email: error.message });
      return;
    }

    if (!data.session) {
      toast.success("Revisa tu correo para confirmar la cuenta.");
      router.push("/login");
      return;
    }

    router.push("/role-selection");
    router.refresh();
  }

  return (
    <div className="mx-auto grid min-h-[calc(100vh-65px)] max-w-7xl lg:grid-cols-[0.82fr_1.18fr]">
      <aside className="relative hidden min-h-full overflow-hidden bg-forest lg:block" aria-label="Pasos para crear tu perfil en Conecta">
        <Image
          src={img("farmerPeru")}
          alt="Productora rural trabajando en el campo peruano"
          fill
          sizes="42vw"
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-forest/88" />
        <div className="relative flex h-full min-h-[720px] flex-col justify-between p-10 xl:p-12 text-white">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <BrandLogo size={42} />
            <span className="font-heading text-2xl font-semibold">Conecta</span>
          </Link>

          <div className="max-w-md space-y-8">
            <div className="space-y-3">
              <p className="text-sm font-medium text-mint">Tu operación empieza aquí</p>
              <h1 className="text-balance font-heading text-4xl font-semibold leading-tight tracking-tight">
                Una cuenta para producir, comprar o transportar.
              </h1>
              <p className="text-pretty text-sm leading-6 text-white/80">
                Crea tu acceso y configura después los roles que necesitas. Puedes participar de más de una forma.
              </p>
            </div>

            <ol className="space-y-5">
              {STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                      index === 0 ? "bg-white text-forest" : "border border-white/30 bg-white/10 text-white"
                    }`}
                    aria-hidden="true"
                  >
                    {index === 0 ? <Check className="size-4" /> : index + 1}
                  </span>
                  <span>
                    <span className="block font-medium">{step.title}</span>
                    <span className="mt-0.5 block text-sm leading-5 text-white/70">{step.description}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <p className="flex items-center gap-2 text-xs text-white/70">
            <ShieldCheck className="size-4 text-mint" aria-hidden="true" />
            Tus datos se usan para proteger y coordinar tus operaciones.
          </p>
        </div>
      </aside>

      <main className="flex items-center justify-center px-4 py-8 sm:px-8 sm:py-10 lg:px-12 xl:px-16">
        <div className="w-full max-w-2xl">
          <div className="mb-7 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <Link href="/" className="flex items-center gap-3 lg:hidden hover:opacity-90 transition-opacity">
                <BrandLogo size={38} />
                <span className="font-heading text-xl font-semibold">Conecta</span>
              </Link>
              <span className="ml-auto rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                Paso 1 de 3
              </span>
            </div>
            <div>
              <h2 className="text-balance font-heading text-3xl font-semibold tracking-tight">Crea tu cuenta</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Primero necesitamos tus datos de acceso. En el siguiente paso elegirás si participas como productor, comprador o transportista.
              </p>
            </div>
          </div>

          <form ref={formRef} className="space-y-5" onSubmit={submitRegistration} noValidate>
            {Object.keys(errors).length > 0 && (
              <div role="alert" className="flex items-start gap-2.5 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <p>Revisa los campos marcados antes de continuar.</p>
              </div>
            )}

            <fieldset className="space-y-4">
              <legend className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <UserRoundCheck className="size-4 text-primary" aria-hidden="true" />
                Datos personales
              </legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">Nombres</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    autoComplete="given-name"
                    maxLength={60}
                    aria-invalid={Boolean(errors.firstName)}
                    aria-describedby={errors.firstName ? "firstName-error" : undefined}
                    placeholder="Ej. Rosa Elena"
                    className="h-10"
                  />
                  {errors.firstName && <p id="firstName-error" className="text-xs text-destructive">{errors.firstName}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Apellidos</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    autoComplete="family-name"
                    maxLength={60}
                    aria-invalid={Boolean(errors.lastName)}
                    aria-describedby={errors.lastName ? "lastName-error" : undefined}
                    placeholder="Ej. Quispe Mamani"
                    className="h-10"
                  />
                  {errors.lastName && <p id="lastName-error" className="text-xs text-destructive">{errors.lastName}</p>}
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-4 border-t border-border pt-5">
              <legend className="flex items-center gap-2 bg-background pr-3 text-sm font-semibold">
                <LockKeyhole className="size-4 text-primary" aria-hidden="true" />
                Datos de acceso
              </legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Celular</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={15}
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={errors.phone ? "phone-error" : "phone-help"}
                    placeholder="999 999 999"
                    className="h-10"
                  />
                  {errors.phone ? (
                    <p id="phone-error" className="text-xs text-destructive">{errors.phone}</p>
                  ) : (
                    <p id="phone-help" className="text-xs text-muted-foreground">Lo usaremos para avisos de tus operaciones.</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    spellCheck={false}
                    maxLength={100}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    placeholder="nombre@ejemplo.com"
                    className="h-10"
                  />
                  {errors.email && <p id="email-error" className="text-xs text-destructive">{errors.email}</p>}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      maxLength={72}
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby={errors.password ? "password-error" : "password-help"}
                      placeholder="Mínimo 8 caracteres"
                      className="h-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                    </button>
                  </div>
                  {errors.password ? (
                    <p id="password-error" className="text-xs text-destructive">{errors.password}</p>
                  ) : (
                    <p id="password-help" className="text-xs text-muted-foreground">Usa 8 caracteres o más.</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="passwordConfirmation">Confirmar contraseña</Label>
                  <Input
                    id="passwordConfirmation"
                    name="passwordConfirmation"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    maxLength={72}
                    aria-invalid={Boolean(errors.passwordConfirmation)}
                    aria-describedby={errors.passwordConfirmation ? "passwordConfirmation-error" : undefined}
                    placeholder="Repite tu contraseña"
                    className="h-10"
                  />
                  {errors.passwordConfirmation && (
                    <p id="passwordConfirmation-error" className="text-xs text-destructive">{errors.passwordConfirmation}</p>
                  )}
                </div>
              </div>
            </fieldset>

            <div className="space-y-2">
              <div className="flex items-start gap-3 rounded-xl bg-muted/70 p-3.5">
                <Checkbox
                  id="terms"
                  name="terms"
                  checked={acceptedTerms}
                  onCheckedChange={setAcceptedTerms}
                  aria-invalid={Boolean(errors.terms)}
                  aria-describedby={errors.terms ? "terms-error" : undefined}
                  className="mt-0.5"
                />
                <Label htmlFor="terms" className="text-sm font-normal leading-5 text-foreground">
                  Acepto los términos y condiciones y la política de privacidad de Conecta.
                </Label>
              </div>
              {errors.terms && <p id="terms-error" className="text-xs text-destructive">{errors.terms}</p>}
            </div>

            <div className="space-y-3 pt-1">
              <Button type="submit" size="lg" className="h-11 w-full gap-2" disabled={isSubmitting}>
                {isSubmitting ? "Creando cuenta..." : "Crear cuenta y continuar"}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                ¿Ya tienes una cuenta?{" "}
                <Link href="/login" className="font-medium text-primary hover:underline">Inicia sesión</Link>
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
